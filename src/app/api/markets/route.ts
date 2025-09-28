// src/app/api/markets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database/supabase';
import { z } from 'zod';

const createMarketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().min(1),
  points: z.number().min(1),
  kalshiId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      if (status === 'resolved') {
        query = query.eq('is_resolved', true);
      } else if (status === 'pending') {
        query = query.eq('is_resolved', false);
      }
    }

    const { data: markets, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ markets });
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
    const validatedData = createMarketSchema.parse(body);

    // Get user from auth header (implement your auth logic)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: market, error } = await supabase
      .from('markets')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        points: validatedData.points,
        kalshi_id: validatedData.kalshiId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ market }, { status: 201 });
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
