import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Hook for fetching conversations list
 */
export function useConversations(options?: { limit?: number }) {
  const conversations = useQuery(api.conversations.list, options ?? {});

  return {
    conversations: conversations ?? [],
    isLoading: conversations === undefined,
  };
}

/**
 * Hook for fetching a single conversation
 */
export function useConversation(id: Id<"conversations"> | null) {
  const conversation = useQuery(
    api.conversations.get,
    id ? { id } : "skip"
  );

  return {
    conversation,
    isLoading: id !== null && conversation === undefined,
  };
}

/**
 * Hook for fetching messages in a conversation
 */
export function useMessages(conversationId: Id<"conversations"> | null, options?: {
  limit?: number;
  before?: number;
}) {
  const messages = useQuery(
    api.conversations.getMessages,
    conversationId ? { conversationId, ...options } : "skip"
  );

  return {
    messages: messages ?? [],
    isLoading: conversationId !== null && messages === undefined,
  };
}

/**
 * Hook for conversation mutations
 */
export function useConversationMutations() {
  const create = useMutation(api.conversations.create);
  const addMessage = useMutation(api.conversations.addMessage);
  const updateTitle = useMutation(api.conversations.updateTitle);
  const remove = useMutation(api.conversations.remove);

  return {
    createConversation: create,
    addMessage,
    updateConversationTitle: updateTitle,
    deleteConversation: remove,
  };
}

/**
 * Hook for searching conversations
 */
export function useSearchConversations(query: string | null, options?: { limit?: number }) {
  const results = useQuery(
    api.conversations.search,
    query ? { query, ...options } : "skip"
  );

  return {
    results: results ?? [],
    isLoading: query !== null && results === undefined,
  };
}
