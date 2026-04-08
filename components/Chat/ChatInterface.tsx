'use client'

import { useState, useEffect, FormEvent, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { chatWithAgent, type SerializedChatMessage, type AgentResponse } from '@/lib/agent'
import type { EmployeeContext } from '@/lib/agent/gemini-agent'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Send, Bot, User, Info, Check, X, MessageSquare, Paperclip } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PaymentFlowAnimation } from '@/components/PaymentFlowAnimation'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  role: 'admin' | 'employee'
  /** When set, show messages from this Convex conversation. When null, "new chat" – no messages until user sends. */
  conversationId: Id<'conversations'> | null
  /** Called when a new conversation is created (e.g. first send in "new chat") so the layout can select it. */
  onConversationCreated?: (id: Id<'conversations'>) => void
  initialMessage?: string
}

/** Map Convex message to UI shape; filter out system messages for display. */
function convexToSerialized(m: { role: string; content: string; timestamp: number; paymentTriggered?: boolean }): SerializedChatMessage {
  return {
    role: m.role === 'assistant' ? 'agent' : (m.role === 'user' ? 'user' : 'agent'),
    content: m.content,
    timestamp: new Date(m.timestamp).toISOString(),
    paymentCompleted: m.paymentTriggered,
  }
}

export function ChatInterface({ role, conversationId, onConversationCreated, initialMessage }: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentAnimation, setShowPaymentAnimation] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { user: currentUser } = useCurrentUser()
  const employeeMemory = useQuery(
    api.employees.getWithMemory,
    currentUser?.employeeId
      ? { employeeId: currentUser.employeeId as Id<'employees'> }
      : 'skip'
  )

  const convexMessages = useQuery(
    api.conversations.getMessages,
    conversationId ? { conversationId } : 'skip'
  )
  const createConversation = useMutation(api.conversations.create)
  const addMessage = useMutation(api.conversations.addMessage)
  const checkUsage = useMutation(api.rateLimits.checkAgentUsage)

  const chatHistory: SerializedChatMessage[] = convexMessages
    ? convexMessages
        .filter((m) => m.role !== 'system')
        .map((m) => convexToSerialized(m))
    : []

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory, isLoading])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    setIsLoading(true)

    const isBookingMessage = userMessage.toLowerCase().startsWith('go ahead and book')
    setShowPaymentAnimation(isBookingMessage)

    let activeConversationId = conversationId
    if (!activeConversationId) {
      try {
        activeConversationId = await createConversation({ initialMessage: userMessage })
        onConversationCreated?.(activeConversationId)
      } catch (err) {
        console.error('Failed to create conversation:', err)
        setIsLoading(false)
        setShowPaymentAnimation(false)
        return
      }
    } else {
      await addMessage({
        conversationId: activeConversationId,
        role: 'user',
        content: userMessage,
      })
    }

    // Check rate limit before calling the agent
    if (currentUser?.userId) {
      try {
        const usage = await checkUsage({ userId: currentUser.userId })
        if (!usage.allowed) {
          await addMessage({
            conversationId: activeConversationId,
            role: 'assistant',
            content: usage.message ?? 'Rate limit reached. Please try again later.',
          })
          setIsLoading(false)
          setShowPaymentAnimation(false)
          return
        }
      } catch {
        // Don't block on rate limit check failure
      }
    }

    const historyForAgent: SerializedChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
    ]

    try {
      const agentResponse = await chatWithAgent(
        userMessage,
        historyForAgent,
        employeeMemory ?? undefined,
        role
      )
      await addMessage({
        conversationId: activeConversationId,
        role: 'assistant',
        content: agentResponse.content,
        paymentTriggered: agentResponse.paymentCompleted,
      })
    } catch (error) {
      console.error('Error chatting with agent:', error)
      await addMessage({
        conversationId: activeConversationId,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      })
    } finally {
      setIsLoading(false)
      setShowPaymentAnimation(false)
    }
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-title text-foreground">
            AI Travel Agent
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">
            {role === 'admin' ? 'Operations monitoring & policy overrides' : 'Personalized travel planning'}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide paper-inset blob-3-gold text-gold-foreground">
          <Info className="w-3.5 h-3.5" />
          AI responses may vary
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden rounded-2xl paper-card min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin paper-inset rounded-none">
          {chatHistory.map((msg, index) => {
            const isProposal = msg.role === 'agent' && msg.content.includes('Proposed Itinerary')

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'agent' && (
                  <div className="w-8 h-8 paper-inset blob-1 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-emerald-700 text-emerald-600" />
                  </div>
                )}

                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-[0_4px_16px_-4px_rgba(16,185,129,0.3)]'
                        : 'paper-card text-foreground'
                    )}
                  >
                    {msg.paymentCompleted && (
                      <div className="mb-3">
                        <PaymentFlowAnimation showCompletion={true} />
                      </div>
                    )}

                    {msg.role === 'agent' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-1">{children}</ol>,
                          li: ({ children }) => <li className="pl-0.5">{children}</li>,
                          code: ({ children, className }) => {
                            const isInline = !className
                            return isInline ? (
                              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                            ) : (
                              <code className="block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto my-2 border border-border/40">{children}</code>
                            )
                          },
                          pre: ({ children }) => <pre className="mb-2">{children}</pre>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
                              {children}
                            </a>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3 rounded-lg border border-border/40">
                              <table className="min-w-full divide-y divide-border/40">{children}</table>
                            </div>
                          ),
                          th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground bg-muted/50">{children}</th>,
                          td: ({ children }) => <td className="px-3 py-2 text-xs border-t border-border/40">{children}</td>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {isProposal && role === 'admin' && (
                      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/10">
                        <Button size="sm" className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-widest btn-press" onClick={() => setMessage('Go ahead and book this itinerary as proposed.')}>
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5 btn-press" onClick={() => setMessage('I want to request a revision to this itinerary: ')}>
                          <X className="w-3.5 h-3.5" /> Request Revision
                        </Button>
                      </div>
                    )}

                    {isProposal && role === 'employee' && (
                      <div className="mt-4 pt-3 border-t border-border/10">
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1.5 btn-press" onClick={() => setMessage('I want to request a revision to this itinerary: ')}>
                          <MessageSquare className="w-3.5 h-3.5" /> Request Revision
                        </Button>
                      </div>
                    )}
                  </div>

                  <span
                    className={cn(
                      'text-[10px] text-muted-foreground/50 px-1',
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    )}
                  >
                    {msg.role === 'user' ? 'You' : 'TripWeaver AI'} &middot; {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 paper-inset blob-3 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            )
          })}

          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 paper-inset blob-1 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4 text-emerald-700 text-emerald-600" />
                </div>
                <div className="paper-card rounded-2xl px-4 py-3">
                  {showPaymentAnimation ? (
                    <div className="w-full max-w-xs">
                      <PaymentFlowAnimation isLoading={true} />
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center py-1">
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-border/10">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={role === 'admin' ? 'Issue a command or policy override...' : 'Ask anything about your trip...'}
                disabled={isLoading}
                className="w-full pl-4 pr-24 h-12 paper-inset rounded-xl border-0 text-sm focus-visible:ring-1 focus-visible:ring-emerald-500/30"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground/50 hover:text-muted-foreground">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button type="submit" disabled={!message.trim() || isLoading} size="icon-sm" className="paper-inset blob-1 text-emerald-700 text-emerald-600 disabled:opacity-40 btn-press">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
          <div className="mt-3 flex items-center justify-center gap-4 text-label opacity-50">
            <span>Powered by TripWeaver AI</span>
            <span>&middot;</span>
            <span>Encrypted</span>
            <span>&middot;</span>
            <span>Policy Aware</span>
          </div>
        </div>
      </div>
    </div>
  )
}
