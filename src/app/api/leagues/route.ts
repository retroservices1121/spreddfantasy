import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database/supabase';
import { z } from 'zod';

const createLeagueSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  leagueType: z.enum(['daily', 'weekly', 'monthly']),
  entryFee: z.number().min(0),
  maxParticipants: z.number().min(1),
  duration: z.number().min(1), // in seconds
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('leagues')
      .select(`
        *,
        creator:users!creator_id(id, username, avatar_url),
        _count:portfolios(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'ended') {
        query = query.eq('is_resolved', true);
      }
    }

    const { data: leagues, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leagues });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createLeagueSchema.parse(body);

    // Get user from auth header (implement your auth logic)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from token (implement your token validation)
    const userId = 'user-id-from-token'; // Replace with actual implementation

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + validatedData.duration * 1000);

    const { data: league, error } = await supabase
      .from('leagues')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        league_type: validatedData.leagueType,
        entry_fee: validatedData.entryFee,
        max_participants: validatedData.maxParticipants,
        creator_id: userId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ league }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
