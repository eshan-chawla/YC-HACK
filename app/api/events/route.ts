import { NextRequest, NextResponse } from 'next/server'

/**
 * DEPRECATED: This API route is deprecated in favor of Convex mutations.
 * 
 * For new code, use Convex directly:
 * - To create events: useMutation(api.events.create)
 * - To list events: useQuery(api.events.list)
 * 
 * This route is kept temporarily for backward compatibility during migration.
 */

export async function POST(request: NextRequest) {
  // Return deprecation notice
  return NextResponse.json(
    { 
      error: 'This API is deprecated. Use Convex mutations instead.',
      migration: 'Use useMutation(api.events.create) from convex/react'
    },
    { status: 410 } // Gone
  )
}

export async function GET() {
  // Return deprecation notice  
  return NextResponse.json(
    { 
      error: 'This API is deprecated. Use Convex queries instead.',
      migration: 'Use useQuery(api.events.list) from convex/react'
    },
    { status: 410 } // Gone
  )
}
