'use client'

import { useState, useEffect, FormEvent, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { chatWithAgent, type SerializedChatMessage, type AgentResponse } from '@/lib/agent'
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

  const convexMessages = useQuery(
    api.conversations.getMessages,
    conversationId ? { conversationId } : 'skip'
  )
  const createConversation = useMutation(api.conversations.create)
  const addMessage = useMutation(api.conversations.addMessage)

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

    const historyForAgent: SerializedChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
    ]

    try {
      const agentResponse = await chatWithAgent(userMessage, historyForAgent)
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
          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">
            AI Travel Agent
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role === 'admin' ? 'Operations monitoring & policy overrides' : 'Personalized travel planning'}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-md text-xs font-medium border border-amber-200/60 dark:border-amber-800/40">
          <Info className="w-3.5 h-3.5" />
          AI responses may vary
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
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
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div
                    className={cn(
                      'rounded-xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-foreground border border-border/40'
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
                      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/40">
                        <Button size="sm" className="text-xs h-8 gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5">
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    )}

                    {isProposal && role === 'employee' && (
                      <div className="mt-4 pt-3 border-t border-border/40">
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1.5">
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
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
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
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted/50 rounded-xl px-4 py-3 border border-border/40">
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

        <div className="p-4 border-t border-border/40">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={role === 'admin' ? 'Issue a command or policy override...' : 'Ask anything about your trip...'}
                disabled={isLoading}
                className="w-full pl-4 pr-24 h-11 bg-muted/30 border-border/40 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground/50 hover:text-muted-foreground">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button type="submit" disabled={!message.trim() || isLoading} size="icon-sm" className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/40">
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
