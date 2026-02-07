/**
 * Agent Module - Gemini-powered Travel Assistant
 * 
 * This module exports the main agent functionality for use in the application.
 */

// Main agent functions
export {
  chatWithGeminiAgent,
  chatWithGeminiAgentStream,
  askGeminiAgent,
} from "./gemini-agent";

// Tool executor
export {
  executeTool,
  executeTools,
  type DatabaseContext,
} from "./tool-executor";

// MCP clients
export {
  kiwiClient,
  locusClient,
  KiwiClient,
  LocusClient,
} from "./mcp-integration";

// Function definitions
export {
  allFunctionDeclarations,
  TOOL_CATEGORIES,
} from "./function-definitions";

// Types
export type {
  AgentMessage,
  AgentResponse,
  ToolCall,
  ToolResult,
  Flight,
  FlightSearchParams,
  FlightSearchResult,
  GeneratedItinerary,
  ItineraryRequest,
  ChatHistory,
  MCPTool,
  GeminiFunctionDeclaration,
} from "./types";
