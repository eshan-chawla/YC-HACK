import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, getCurrentUser } from "./auth.helpers";

// Tool call validator
const toolCallValidator = v.object({
  id: v.string(),
  name: v.string(),
  arguments: v.string(),
  result: v.optional(v.string()),
});

// Get all conversations for the current user
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 50);

    return conversations;
  },
});

// Get a single conversation with messages
export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      return null;
    }

    // Check ownership
    if (conversation.userId !== user._id) {
      throw new Error("Unauthorized: Cannot access this conversation");
    }

    return conversation;
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    before: v.optional(v.number()), // Timestamp for pagination
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Unauthorized: Cannot access this conversation");
    }

    let messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    // Apply pagination
    if (args.before) {
      messages = messages.filter((m) => m.timestamp < args.before!);
    }

    if (args.limit) {
      messages = messages.slice(-args.limit);
    }

    return messages;
  },
});

// Create a new conversation
export const create = mutation({
  args: {
    title: v.optional(v.string()),
    initialMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      userId: user._id,
      title: args.title,
      lastMessageAt: now,
      createdAt: now,
    });

    // Add initial user message if provided
    if (args.initialMessage) {
      await ctx.db.insert("messages", {
        conversationId,
        role: "user",
        content: args.initialMessage,
        timestamp: now,
      });
    }

    return conversationId;
  },
});

// Add a message to a conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    toolCalls: v.optional(v.array(toolCallValidator)),
    paymentTriggered: v.optional(v.boolean()),
    paymentAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify conversation ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Unauthorized: Cannot add message to this conversation");
    }

    const now = Date.now();

    // Add message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      toolCalls: args.toolCalls,
      paymentTriggered: args.paymentTriggered,
      paymentAmount: args.paymentAmount,
      timestamp: now,
    });

    // Update conversation last message time and title if first message
    const updates: Record<string, unknown> = { lastMessageAt: now };
    
    if (!conversation.title && args.role === "user") {
      // Generate title from first user message (truncated)
      updates.title = args.content.slice(0, 50) + (args.content.length > 50 ? "..." : "");
    }

    await ctx.db.patch(args.conversationId, updates);

    return messageId;
  },
});

// Update conversation title
export const updateTitle = mutation({
  args: {
    id: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Unauthorized: Cannot update this conversation");
    }

    await ctx.db.patch(args.id, { title: args.title });
    return args.id;
  },
});

// Delete a conversation and all its messages
export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Unauthorized: Cannot delete this conversation");
    }

    // Delete all messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete conversation
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Get conversation count for user
export const getCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return conversations.length;
  },
});

// Search conversations by title
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const searchLower = args.query.toLowerCase();
    const filtered = conversations.filter(
      (c) => c.title?.toLowerCase().includes(searchLower)
    );

    return filtered.slice(0, args.limit ?? 20);
  },
});
