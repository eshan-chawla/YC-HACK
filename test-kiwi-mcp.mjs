/**
 * Test script for Kiwi MCP server connection
 * Run with: node test-kiwi-mcp.mjs
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function test() {
  console.log("Testing Kiwi MCP Server connection...\n");
  
  try {
    const transport = new StreamableHTTPClientTransport(
      new URL("https://mcp.kiwi.com")
    );
    
    const client = new Client(
      { name: "test-client", version: "1.0.0" },
      { capabilities: {} }
    );
    
    console.log("1. Connecting to https://mcp.kiwi.com...");
    await client.connect(transport);
    console.log("   ✓ Connected successfully!\n");
    
    console.log("2. Listing available tools...");
    const tools = await client.listTools();
    console.log("   Available tools:");
    tools.tools.forEach((t) => {
      console.log(`   - ${t.name}: ${t.description || "No description"}`);
    });
    console.log("");
    
    console.log("3. Testing search-flight tool...");
    const result = await client.callTool({
      name: "search-flight",
      arguments: {
        origin: "JFK",
        destination: "LHR",
        departure_date: "2026-03-15"
      }
    });
    
    console.log("   ✓ Search completed!");
    console.log("   Response content types:", result.content.map(c => c.type));
    
    // Show first 500 chars of text response if available
    const textContent = result.content.find(c => c.type === "text");
    if (textContent && textContent.type === "text") {
      console.log("\n   Sample response (first 500 chars):");
      console.log("   " + textContent.text.substring(0, 500).replace(/\n/g, "\n   "));
    }
    
    await client.close();
    console.log("\n✓ Test completed successfully!");
    
  } catch (error) {
    console.error("\n✗ Test failed:", error.message);
    if (error.cause) {
      console.error("  Cause:", error.cause);
    }
    process.exit(1);
  }
}

test();
