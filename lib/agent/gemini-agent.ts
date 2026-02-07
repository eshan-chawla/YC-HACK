/**
 * Gemini Agent - Travel Assistant
 * 
 * This module implements the main AI agent using Google's Gemini 2.5 model.
 * It handles:
 * - Natural language conversations
 * - Function calling for tools (flight search, itinerary generation, payments)
 * - Streaming responses
 * - Context management
 */

import { GoogleGenerativeAI, FunctionCallingMode, Part, Content } from "@google/generative-ai";
import { allFunctionDeclarations } from "./function-definitions";
import { executeTool, executeTools, DatabaseContext } from "./tool-executor";
import type { AgentMessage, AgentResponse, ToolCall, ToolResult, GeneratedItinerary } from "./types";

// System prompt for the travel assistant
const SYSTEM_PROMPT = `You are TripWeaver AI, an intelligent corporate travel assistant. Your role is to help companies manage employee travel for business events.

## Your Capabilities
1. **Flight Search**: Search for flights using Kiwi.com, finding the best options based on dates, budget, and preferences.
2. **Itinerary Generation**: Create personalized travel itineraries for employees, considering their restrictions (dietary, mobility, seating preferences).
3. **Budget Management**: Ensure all bookings stay within the admin-defined budget per employee.
4. **Team Trip Planning**: Generate itineraries for entire teams participating in the same event.
5. **Booking & Payment**: Process bookings and payments through Locus payment system.

## Guidelines
- Always check budget compliance before suggesting itineraries
- Respect employee restrictions and preferences
- Provide clear cost breakdowns
- Ask clarifying questions when information is missing
- Be proactive in suggesting optimal travel options
- When generating team itineraries, ensure all employees get fair treatment within budget

## Response Format
- Be concise but informative
- Use bullet points for flight options
- Include prices in USD
- Highlight any policy compliance issues
- Summarize total costs clearly

Remember: You're helping companies save time and money on corporate travel while ensuring employee comfort and policy compliance.`;

// Initialize Gemini client
function getGeminiClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Main chat function - processes user messages and returns agent responses
 */
export async function chatWithGeminiAgent(
  userMessage: string,
  chatHistory: AgentMessage[] = [],
  dbContext?: DatabaseContext
): Promise<AgentResponse> {
  const genAI = getGeminiClient();
  
  // Get the Gemini 2.5 Pro model with function calling
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: SYSTEM_PROMPT,
    tools: [{
      functionDeclarations: allFunctionDeclarations.map(fd => ({
        name: fd.name,
        description: fd.description,
        parameters: fd.parameters as any,
      })),
    }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.AUTO,
      },
    },
  });

  // Convert chat history to Gemini format
  const history: Content[] = chatHistory.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  // Start chat session
  const chat = model.startChat({
    history,
  });

  // Send user message
  let result = await chat.sendMessage(userMessage);
  let response = result.response;

  // Track tool calls and payment status
  const allToolCalls: ToolCall[] = [];
  let paymentTriggered = false;
  let paymentAmount = 0;
  let generatedItinerary: GeneratedItinerary | undefined;

  // Handle function calls (loop until no more function calls)
  while (response.functionCalls() && response.functionCalls()!.length > 0) {
    const functionCalls = response.functionCalls()!;

    // Convert to our ToolCall format
    const toolCalls: ToolCall[] = functionCalls.map((fc, index) => ({
      id: `call_${Date.now()}_${index}`,
      name: fc.name,
      arguments: fc.args as Record<string, unknown>,
    }));

    allToolCalls.push(...toolCalls);

    // Execute tools
    const toolResults = await executeTools(toolCalls, dbContext);

    // Check for payment and itinerary in results
    for (const toolResult of toolResults) {
      if (toolResult.name === "process_payment" && !toolResult.error) {
        const paymentResult = toolResult.result as { success: boolean; actualAmount: number };
        if (paymentResult.success) {
          paymentTriggered = true;
          paymentAmount = paymentResult.actualAmount;
        }
      }
      
      if ((toolResult.name === "generate_itinerary" || toolResult.name === "generate_team_itineraries") && !toolResult.error) {
        const itineraryResult = toolResult.result as GeneratedItinerary | { itineraries: GeneratedItinerary[] };
        if ('itineraries' in itineraryResult) {
          generatedItinerary = itineraryResult.itineraries[0];
        } else {
          generatedItinerary = itineraryResult;
        }
      }
    }

    // Send function results back to the model
    const functionResponseParts: Part[] = toolResults.map(tr => ({
      functionResponse: {
        name: tr.name,
        response: {
          result: tr.error ? { error: tr.error } : tr.result,
        },
      },
    }));

    result = await chat.sendMessage(functionResponseParts);
    response = result.response;
  }

  // Get final text response
  const textContent = response.text();

  return {
    content: textContent,
    toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
    paymentTriggered,
    paymentAmount: paymentTriggered ? paymentAmount : undefined,
    itineraryGenerated: generatedItinerary,
  };
}

/**
 * Streaming chat function - yields response chunks as they're generated
 */
export async function* chatWithGeminiAgentStream(
  userMessage: string,
  chatHistory: AgentMessage[] = [],
  dbContext?: DatabaseContext
): AsyncGenerator<{ type: "text" | "tool_start" | "tool_end" | "done"; content: string; toolCall?: ToolCall; toolResult?: ToolResult }> {
  const genAI = getGeminiClient();
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: SYSTEM_PROMPT,
    tools: [{
      functionDeclarations: allFunctionDeclarations.map(fd => ({
        name: fd.name,
        description: fd.description,
        parameters: fd.parameters as any,
      })),
    }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.AUTO,
      },
    },
  });

  // Convert chat history
  const history: Content[] = chatHistory.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });

  // Send message and stream response
  const streamResult = await chat.sendMessageStream(userMessage);
  let fullContent = "";
  let functionCalls: any[] = [];

  for await (const chunk of streamResult.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      fullContent += chunkText;
      yield { type: "text", content: chunkText };
    }

    // Check for function calls in chunk
    const chunkFunctionCalls = chunk.functionCalls();
    if (chunkFunctionCalls && chunkFunctionCalls.length > 0) {
      functionCalls.push(...chunkFunctionCalls);
    }
  }

  // Handle function calls if any
  if (functionCalls.length > 0) {
    for (let i = 0; i < functionCalls.length; i++) {
      const fc = functionCalls[i];
      const toolCall: ToolCall = {
        id: `call_${Date.now()}_${i}`,
        name: fc.name,
        arguments: fc.args as Record<string, unknown>,
      };

      yield { type: "tool_start", content: `Calling ${fc.name}...`, toolCall };

      // Execute tool
      const toolResult = await executeTool(toolCall, dbContext);

      yield { type: "tool_end", content: toolResult.error || "Tool completed", toolResult };
    }

    // Send function results back and stream the continuation
    const functionResponseParts: Part[] = functionCalls.map((fc, i) => ({
      functionResponse: {
        name: fc.name,
        response: { result: "Function executed" }, // Simplified for streaming
      },
    }));

    const continuationResult = await chat.sendMessageStream(functionResponseParts);
    
    for await (const chunk of continuationResult.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield { type: "text", content: chunkText };
      }
    }
  }

  yield { type: "done", content: "" };
}

/**
 * Simple wrapper for non-streaming use cases
 */
export async function askGeminiAgent(
  question: string,
  context?: {
    eventId?: string;
    employeeId?: string;
    conversationId?: string;
  }
): Promise<string> {
  const response = await chatWithGeminiAgent(question, []);
  return response.content;
}

// Export types
export type { AgentMessage, AgentResponse, ToolCall, ToolResult };
