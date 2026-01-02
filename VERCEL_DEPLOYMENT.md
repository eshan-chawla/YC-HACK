# Vercel Deployment Guide for TripWeaver

## Environment Variables Required

Make sure to set these in your Vercel project settings (Settings → Environment Variables):

### Required:
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude

### Optional (for full functionality):
- `LOCUS_API_KEY` - For Locus payment integration
- `KIWI_API_KEY` - For Kiwi.com flight search integration

## Deployment Notes

### Claude Code SDK in Serverless

The `@anthropic-ai/claude-agent-sdk` requires the `claude-code` executable, which **cannot run in Vercel's serverless environment**. 

**Current Behavior:**
- The code detects Vercel/serverless environments automatically
- Sets `pathToClaudeCodeExecutable` to `null` in serverless
- The SDK will work for basic chat and MCP tool usage
- Code execution features will be disabled (this is expected in serverless)

**What Works:**
- ✅ Chat functionality
- ✅ MCP tool usage (Locus payments, Kiwi.com flight search)
- ✅ Basic agent responses

**What Doesn't Work:**
- ❌ Code execution features (requires executable)
- ❌ Local file system access

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `ANTHROPIC_API_KEY` = `your_key_here`
   - `LOCUS_API_KEY` = `your_key_here` (if using)
   - `KIWI_API_KEY` = `your_key_here` (if using)
4. Select environments: **Production**, **Preview**, **Development**
5. Click **Save**
6. Redeploy your application

### Verifying Deployment

After deployment, check:
1. Build logs for any errors
2. Function logs in Vercel dashboard
3. Test the chat interface at `/employee`

If you see "Claude Code executable" errors, this is expected in serverless and the agent will still work for basic functionality.

## Troubleshooting

### Build Fails
- Check that `pnpm-lock.yaml` is committed
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Runtime Errors
- Verify `ANTHROPIC_API_KEY` is set in Vercel environment variables
- Check function logs in Vercel dashboard
- Ensure environment variables are set for the correct environment (Production/Preview/Development)

### Chat Not Working
- Check Vercel function logs for API key errors
- Verify the API key is valid and has credits
- Check network tab in browser for failed requests


