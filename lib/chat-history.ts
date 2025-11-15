export interface ChatMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

export class ChatHistory {
  private messages: ChatMessage[] = []

  /**
   * Add a message to the chat history
   */
  addMessage(role: 'user' | 'agent', content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: new Date(),
    })
  }

  /**
   * Get all messages in the chat history
   */
  getMessages(): ChatMessage[] {
    return [...this.messages]
  }

  /**
   * Get the last N messages
   */
  getLastMessages(count: number): ChatMessage[] {
    return this.messages.slice(-count)
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = []
  }

  /**
   * Get the total number of messages
   */
  getMessageCount(): number {
    return this.messages.length
  }
}

// Singleton instance for a single user (hackathon use case)
let chatHistoryInstance: ChatHistory | null = null

export function getChatHistory(): ChatHistory {
  if (!chatHistoryInstance) {
    chatHistoryInstance = new ChatHistory()
  }
  return chatHistoryInstance
}

