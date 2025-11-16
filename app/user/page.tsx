'use client'

import { useState, useEffect, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { chatWithAgent, type SerializedChatMessage, type AgentResponse } from '@/lib/agent'
import { Send, Bot, User } from 'lucide-react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PaymentFlowAnimation } from '@/components/PaymentFlowAnimation'

const INITIAL_MESSAGE: SerializedChatMessage = {
  role: 'agent',
  content: 'Hi John, you have been invited to team Q4 Offsite from Dec 05 to Dec 10 in SF. I see that you are based out of the NYC office. I would love to help you find flights for your journey. Before I start can you confirm that you indeed are flying from NYC and are available for those days?',
  timestamp: '' // Will be set on client side
}

export default function UserChatPage() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<SerializedChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentAnimation, setShowPaymentAnimation] = useState(false)

  // Initialize chat history on client side only to avoid hydration mismatch
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([{
        ...INITIAL_MESSAGE,
        timestamp: new Date().toISOString()
      }])
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    setIsLoading(true)

    // Check if user is booking (starts with "go ahead and book")
    const isBookingMessage = userMessage.toLowerCase().startsWith('go ahead and book')
    setShowPaymentAnimation(isBookingMessage)

    // Add user message to history immediately
    const userMessageEntry: SerializedChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    const updatedHistoryWithUser = [...chatHistory, userMessageEntry]
    setChatHistory(updatedHistoryWithUser)

    try {
      // Pass full chat history (including the new user message) to agent
      const agentResponse = await chatWithAgent(userMessage, updatedHistoryWithUser)
      
      // Add agent response to history
      const agentMessageEntry: SerializedChatMessage = {
        role: 'agent',
        content: agentResponse.content,
        timestamp: new Date().toISOString(),
        paymentCompleted: agentResponse.paymentCompleted
      }
      setChatHistory([...updatedHistoryWithUser, agentMessageEntry])
    } catch (error) {
      console.error('Error chatting with agent:', error)
      // Add error message to history
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
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto py-6 px-6">
            <div className="flex flex-col h-[calc(100vh-3rem)] max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Chat with Agent</h1>
                <p className="text-muted-foreground mt-1">Ask questions and get help with your travel needs</p>
              </div>

        {/* Chat Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden p-6 mb-4">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {chatHistory.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Start a conversation by sending a message below</p>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'agent' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.paymentCompleted && (
                      <div className="mb-4">
                        <PaymentFlowAnimation showCompletion={true} />
                      </div>
                    )}
                    <div className="text-sm">
                      {msg.role === 'agent' ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
                            li: ({ children }) => <li className="ml-1">{children}</li>,
                            code: ({ children, className }) => {
                              const isInline = !className
                              return isInline ? (
                                <code className="bg-background/50 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                              ) : (
                                <code className="block bg-background/50 p-2 rounded text-xs font-mono overflow-x-auto my-2">{children}</code>
                              )
                            },
                            pre: ({ children }) => <pre className="mb-2">{children}</pre>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 text-primary">
                                {children}
                              </a>
                            ),
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-3 italic my-2">{children}</blockquote>,
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-2">
                                <table className="min-w-full border-collapse border border-border">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                            tbody: ({ children }) => <tbody>{children}</tbody>,
                            tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
                            th: ({ children }) => (
                              <th className="border border-border px-3 py-2 text-left font-semibold">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-border px-3 py-2">
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    <p className={`text-xs mt-2 ${
                      msg.role === 'user' 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))
            )}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                {showPaymentAnimation ? (
                  <div className="bg-muted text-foreground rounded-lg px-4 py-3">
                    <PaymentFlowAnimation isLoading={true} />
                  </div>
                ) : (
                  <div className="bg-muted text-foreground rounded-lg px-4 py-3 flex items-center gap-1">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-foreground/60"
                        animate={{
                          y: [0, -8, 0],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 rounded-full bg-foreground/60"
                        animate={{
                          y: [0, -8, 0],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 rounded-full bg-foreground/60"
                        animate={{
                          y: [0, -8, 0],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.4,
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="bg-primary hover:bg-green-600 text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

