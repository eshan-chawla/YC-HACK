'use client'

import { useState, useEffect, FormEvent, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { chatWithAgent, type SerializedChatMessage, type AgentResponse } from '@/lib/agent'
import { Send, Bot, User, Info, Sparkles, Check, X, MessageSquare, Paperclip } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PaymentFlowAnimation } from '@/components/PaymentFlowAnimation'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  role: 'admin' | 'employee'
  initialMessage?: string
}

const INITIAL_MESSAGES: Record<'admin' | 'employee', SerializedChatMessage> = {
  employee: {
    role: 'agent',
    content: 'Hi John, you have been invited to team Q4 Offsite from Dec 05 to Dec 10 in SF. I see that you are based out of the NYC office. I would love to help you find flights for your journey. Before I start can you confirm that you indeed are flying from NYC and are available for those days?',
    timestamp: '' 
  },
  admin: {
    role: 'agent',
    content: 'Welcome back, Admin. I am monitoring 3 active events. There are 2 pending itinerary proposals that require your review. How can I assist you today?',
    timestamp: ''
  }
}

export function ChatInterface({ role, initialMessage }: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<SerializedChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentAnimation, setShowPaymentAnimation] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([{
        ...(INITIAL_MESSAGES[role]),
        timestamp: new Date().toISOString()
      }])
    }
  }, [role])

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

    const userMessageEntry: SerializedChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    const updatedHistoryWithUser = [...chatHistory, userMessageEntry]
    setChatHistory(updatedHistoryWithUser)

    try {
      const agentResponse = await chatWithAgent(userMessage, updatedHistoryWithUser)
      const agentMessageEntry: SerializedChatMessage = {
        role: 'agent',
        content: agentResponse.content,
        timestamp: new Date().toISOString(),
        paymentCompleted: agentResponse.paymentCompleted
      }
      setChatHistory([...updatedHistoryWithUser, agentMessageEntry])
    } catch (error) {
      console.error('Error chatting with agent:', error)
      const errorMessageEntry: SerializedChatMessage = {
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }
      setChatHistory([...updatedHistoryWithUser, errorMessageEntry])
    } finally {
      setIsLoading(false)
      setShowPaymentAnimation(false)
    }
  }

  return (
    <div className="flex h-full flex-col max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            AI Travel Agent
            <Sparkles className="w-5 h-5 text-green-500" />
          </h1>
          <p className="text-muted-foreground mt-1">
            {role === 'admin' ? 'Monitoring travel operations & policy overrides' : 'Personalized travel planning and support'}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-800 shadow-sm">
          <Info className="w-3.5 h-3.5" />
          AI chatbot - responses may vary
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-border/60 rounded-2xl bg-background/50 backdrop-blur-sm">
        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar">
          {chatHistory.map((msg, index) => {
            const isProposal = msg.role === 'agent' && msg.content.includes('Proposed Itinerary')
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-4", msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'agent' && (
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                    <Bot className="w-6 h-6" />
                  </div>
                )}
                
                <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[70%]">
                    <div
                        className={cn(
                            "rounded-2xl px-5 py-4 shadow-sm relative",
                            msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-background text-foreground rounded-tl-none border border-border/60'
                        )}
                    >
                        {msg.paymentCompleted && (
                            <div className="mb-4">
                                <PaymentFlowAnimation showCompletion={true} />
                            </div>
                        )}
                        
                        <div className="text-[15px] leading-relaxed">
                            {msg.role === 'agent' ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1.5 ml-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1.5 ml-1">{children}</ol>,
                                        li: ({ children }) => <li className="pl-1">{children}</li>,
                                        code: ({ children, className }) => {
                                            const isInline = !className
                                            return isInline ? (
                                                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                                            ) : (
                                                <code className="block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto my-3 border border-border/50">{children}</code>
                                            )
                                        },
                                        pre: ({ children }) => <pre className="mb-3">{children}</pre>,
                                        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                                        a: ({ href, children }) => (
                                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline underline-offset-4 hover:text-green-600 transition-colors">
                                                {children}
                                            </a>
                                        ),
                                        table: ({ children }) => (
                                            <div className="overflow-x-auto my-4 rounded-xl border border-border/60 bg-muted/30">
                                                <table className="min-w-full divide-y divide-border/40">
                                                    {children}
                                                </table>
                                            </div>
                                        ),
                                        th: ({ children }) => <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest bg-muted/50">{children}</th>,
                                        td: ({ children }) => <td className="px-4 py-2 text-xs border-t border-border/40 font-medium">{children}</td>,
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                        </div>

                        {/* Role-specific Actions inside agent message */}
                        {isProposal && role === 'admin' && (
                            <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border/40">
                                <Button size="sm" className="bg-primary hover:bg-green-600 text-white font-bold text-[10px] uppercase tracking-widest h-8 px-4 rounded-lg shadow-md shadow-green-500/10">
                                    <Check className="w-3.5 h-3.5 mr-1.5" /> Approve Change
                                </Button>
                                <Button size="sm" variant="outline" className="font-bold text-[10px] uppercase tracking-widest h-8 px-4 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20">
                                    <X className="w-3.5 h-3.5 mr-1.5" /> Reject
                                </Button>
                            </div>
                        )}

                        {isProposal && role === 'employee' && (
                            <div className="mt-6 pt-4 border-t border-border/40">
                                <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest h-9 rounded-lg">
                                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Request Revision
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    <div className={cn(
                        "flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-muted-foreground/40",
                        msg.role === 'user' ? 'justify-end pr-1' : 'justify-start pl-1'
                    )}>
                        {msg.role === 'user' ? 'You' : 'TripWeaver AI'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border/60 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            )
          })}
          
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="bg-background text-foreground rounded-2xl rounded-tl-none px-6 py-5 border border-border/60 shadow-sm min-w-[80px]">
                  {showPaymentAnimation ? (
                    <div className="w-full max-w-xs">
                      <PaymentFlowAnimation isLoading={true} />
                    </div>
                  ) : (
                    <div className="flex gap-1.5 items-center">
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-background border-t border-border/40">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
            <div className="relative flex-1 group">
                <Input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={role === 'admin' ? "Issue a command or policy override..." : "Ask anything about your trip..."}
                    disabled={isLoading}
                    className="w-full pl-5 pr-14 py-7 bg-muted/30 border-border/60 rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-base shadow-inner"
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                    <Paperclip className="w-5 h-5" />
                </Button>
                <Button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-primary hover:bg-green-600 text-primary-foreground shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                    <Send className="w-5 h-5" />
                </Button>
            </div>
          </form>
          <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
            <span>Powered by TripWeaver AI</span>
            <div className="w-1.5 h-1.5 rounded-full bg-border" />
            <span>Encrypted Session</span>
            <div className="w-1.5 h-1.5 rounded-full bg-border" />
            <span>Policy Aware</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

