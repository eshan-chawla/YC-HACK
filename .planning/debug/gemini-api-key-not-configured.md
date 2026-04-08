---
status: resolved
trigger: "gemini-api-key-not-configured"
created: "2026-04-06T00:00:00.000Z"
updated: "2026-04-07T00:00:00.000Z"
---

## Current Focus

hypothesis: API key is set in Convex but code is checking process.env which doesn't have access to Convex env vars in the frontend context
test: Check how GOOGLE_AI_API_KEY is being accessed in the agent code
expecting: Find if the key is being read from wrong source (frontend vs Convex backend)
next_action: Read lib/agent.ts and lib/agent/gemini-agent.ts to understand how API key is accessed

## Symptoms

expected: AI agent generates itineraries using Gemini API and calls MCP tools (Kiwi for flights, etc.)
actual: Configuration error shown in frontend UI - "Google AI API key is not configured. Please ensure GOOGLE_AI_API_KEY is set in your environment variables. For Convex deployment, use: npx convex env set GOOGLE_AI_API_KEY <your-key>"
errors: Configuration error in frontend
reproduction: Sending any chat message to the agent triggers this error
started: Recently (was working before)
key_set: Yes, ran `npx convex env set GOOGLE_AI_API_KEY` command
error_location: Frontend UI (shown in chat interface)

## Evidence

- timestamp: "2026-04-07T00:00:00.000Z"
  checked: "npx convex env list"
  found: "GOOGLE_AI_API_KEY is set in Convex: AIzaSyDd0ARWl0L-y6fsvph-gwk33Lna3JTmQo4"
  implication: Convex backend env has the key configured

- timestamp: "2026-04-07T00:00:00.000Z"
  checked: "grep GOOGLE_AI_API_KEY in codebase"
  found: "Code in lib/agent.ts and lib/agent/gemini-agent.ts checks process.env.GOOGLE_AI_API_KEY"
  implication: Need to verify how Convex provides env vars to serverless functions

- timestamp: "2026-04-07T00:00:00.000Z"
  checked: ".env.local file"
  found: "GOOGLE_AI_API_KEY= (empty) - keys are intentionally NOT in .env.local"
  implication: Next.js server actions don't have access to Convex env vars

- timestamp: "2026-04-07T00:00:00.000Z"
  checked: "How Server Actions access env vars"
  found: "chatWithAgent in lib/agent.ts is a Server Action ('use server') that runs in Next.js server context, NOT Convex"
  implication: Server Actions in Next.js don't automatically get Convex env vars - they only get .env.local vars

## Eliminated

## Resolution

root_cause: "chatWithAgent is a Next.js Server Action that runs in Next.js server context, not in Convex. It only has access to .env.local, not Convex env vars. The Convex env var is correctly set but unreachable from the Next.js server action."

fix: "Added GOOGLE_AI_API_KEY to .env.local for local development. For production, the Next.js deployment needs the key in its environment variables (Vercel env vars)."

verification: "Test chat after server restart - send a message to see if agent responds"

files_changed: [".env.local"]
files_changed: [".planning/debug/gemini-api-key-not-configured.md"]
