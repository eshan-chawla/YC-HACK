import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.destination || !body.event_date || !body.event_time || !body.budget_per_person || !body.employee_ids) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const totalBudget = body.budget_per_person * body.employee_ids.length

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert({
        name: body.name,
        destination: body.destination,
        location: body.location || null,
        event_date: body.event_date,
        event_time: body.event_time,
        budget_per_person: body.budget_per_person,
        total_budget: totalBudget,
        restrictions: body.restrictions || null,
        status: 'pending'
      })
      .select()
      .single()

    if (eventError) {
      console.error('[v0] Supabase error creating event:', eventError)
      return NextResponse.json(
        { error: eventError.message },
        { status: 500 }
      )
    }

    const tripInserts = body.employee_ids.map((employeeId: string) => ({
      event_id: eventData.id,
      employee_id: employeeId,
      status: 'pending',
      price: null,
      trip_details: null
    }))

    const { error: tripsError } = await supabase
      .from('trips')
      .insert(tripInserts)

    if (tripsError) {
      console.error('[v0] Supabase error creating trips:', tripsError)
      // If trips creation fails, we might want to delete the event or handle it differently
      return NextResponse.json(
        { error: 'Event created but failed to create trip entries: ' + tripsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      event: eventData, 
      trips_created: tripInserts.length 
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[v0] Error fetching events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
