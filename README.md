# TripWeaver - AI-Powered Corporate Travel Management

TripWeaver is an intelligent corporate travel management platform that uses AI to generate personalized travel itineraries for team members. It integrates with Kiwi.com for flight search and Locus for payment processing.

## Architecture

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Convex (real-time database + serverless functions)
- **Authentication**: Convex Auth (email/password + Google OAuth)
- **AI Agent**: Google Gemini 2.5 Pro with function calling
- **External APIs**: Kiwi.com MCP (flights), Locus MCP (payments)
- **Testing**: Vitest (unit/integration), Playwright (E2E)

### Key Features

1. **AI Itinerary Generation**: Generate personalized travel itineraries for employees based on:
   - Event requirements (destination, dates, budget)
   - Employee restrictions (dietary, mobility, seating preferences)
   - Company travel policies

2. **Team Trip Planning**: Create itineraries for entire teams with individual customizations

3. **Budget Compliance**: Automatic checking against admin-defined budgets and policies

4. **Real-time Updates**: Convex provides real-time data synchronization across all clients

5. **Role-Based Access**: Admin and employee roles with appropriate permissions

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or pnpm
- A Convex account (free tier available)
- Google AI API key (for Gemini)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/tripweaver.git
cd tripweaver

# Install dependencies
npm install --legacy-peer-deps

# Copy environment template
cp .env.example .env.local
```

### Environment Setup

1. **Set up Convex**:
   ```bash
   npx convex dev
   ```
   This will prompt you to log in and create a project.

2. **Set Convex environment variables**:
   ```bash
   # Google AI API key (for Gemini agent)
   npx convex env set GOOGLE_AI_API_KEY your_key_here
   
   # Kiwi.com API key (for flight search)
   npx convex env set KIWI_API_KEY your_key_here
   
   # Locus API key (for payments)
   npx convex env set LOCUS_API_KEY your_key_here
   
   # Encryption key (generate with: openssl rand -hex 32)
   npx convex env set ENCRYPTION_KEY your_key_here
   
   # Google OAuth (optional)
   npx convex env set AUTH_GOOGLE_CLIENT_ID your_client_id
   npx convex env set AUTH_GOOGLE_CLIENT_SECRET your_client_secret
   ```

3. **Update `.env.local`**:
   ```
   NEXT_PUBLIC_CONVEX_URL=<your-convex-deployment-url>
   ```

### Running the Application

```bash
# Development mode (runs both Next.js and Convex)
npm run dev

# Or run separately:
npm run dev:frontend  # Next.js only
npm run dev:backend   # Convex only
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (requires running app)
npm run test:e2e

# With coverage
npm run test:coverage
```

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard pages
│   ├── auth/              # Authentication pages
│   ├── employee/          # Employee portal pages
│   └── api/               # API routes (deprecated)
├── components/            # React components
│   ├── Chat/             # AI chat interface
│   ├── Employees/        # Employee management
│   ├── EventConfig/      # Event configuration
│   └── ui/               # shadcn/ui components
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── auth.ts           # Auth configuration
│   ├── employees.ts      # Employee queries/mutations
│   ├── events.ts         # Event queries/mutations
│   ├── trips.ts          # Trip queries/mutations
│   ├── itineraries.ts    # Itinerary queries/mutations
│   └── auditLogs.ts      # Audit logging
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── agent/            # Gemini AI agent
│   │   ├── gemini-agent.ts       # Main agent
│   │   ├── mcp-integration.ts    # MCP client
│   │   ├── tool-executor.ts      # Tool execution
│   │   ├── itinerary-generator.ts
│   │   └── budget-checker.ts
│   ├── encryption.ts     # AES-256 encryption
│   ├── audit.ts          # Audit logging helpers
│   └── utils.ts
├── tests/                # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   ├── e2e/             # E2E tests
│   └── helpers/         # Test utilities
└── types/                # TypeScript types
```

## Security

- **Authentication**: Convex Auth with HTTP-only cookies
- **Authorization**: Role-based access control (admin/employee)
- **Encryption**: AES-256-GCM for sensitive data
- **Rate Limiting**: Built-in rate limiting on auth and API endpoints
- **Audit Logging**: Comprehensive logging of security events
- **Secrets**: All API keys stored in Convex environment variables (not in code)

## API Reference

### Agent Tools

The AI agent has access to the following tools:

| Tool | Description |
|------|-------------|
| `search_flights` | Search for flights using Kiwi.com |
| `get_flight_details` | Get details for a specific flight |
| `generate_itinerary` | Generate itinerary for one employee |
| `generate_team_itineraries` | Generate itineraries for a team |
| `check_budget_compliance` | Verify itinerary meets budget |
| `process_payment` | Process payment via Locus |
| `get_event_details` | Get event information |
| `get_employee_details` | Get employee information |

### Convex Functions

See `convex/*.ts` files for the complete API reference.

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy Convex: `npx convex deploy`

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
