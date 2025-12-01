/**
 * Strategies API Routes
 *
 * CRUD operations for product strategies (OKRs/Pillars)
 *
 * GET  /api/strategies - List strategies with filters
 * POST /api/strategies - Create new strategy
 *
 * Security: Team-based RLS with team membership validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  CreateStrategyRequest,
  ProductStrategyWithOwner,
  StrategyType,
  StrategyStatus,
} from '@/lib/types/strategy'

/**
 * GET /api/strategies
 *
 * List strategies with optional filtering.
 * Query params:
 * - team_id (required)
 * - workspace_id (optional)
 * - type (optional): pillar, objective, key_result, initiative
 * - status (optional): draft, active, completed, cancelled, on_hold
 * - parent_id (optional): filter by parent, 'null' for root only
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const teamId = searchParams.get('team_id')
    const workspaceId = searchParams.get('workspace_id')
    const type = searchParams.get('type') as StrategyType | null
    const status = searchParams.get('status') as StrategyStatus | null
    const parentId = searchParams.get('parent_id')

    if (!teamId) {
      return NextResponse.json(
        { error: 'team_id is required' },
        { status: 400 }
      )
    }

    // Validate team membership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Build query
    let query = supabase
      .from('product_strategies')
      .select(`
        *,
        owner:users!product_strategies_owner_id_fkey(id, name, email, avatar_url)
      `)
      .eq('team_id', teamId)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Handle parent_id filter: 'null' string means root only, undefined means all
    if (parentId === 'null') {
      query = query.is('parent_id', null)
    } else if (parentId) {
      query = query.eq('parent_id', parentId)
    }

    query = query.order('sort_order', { ascending: true })
      .order('title', { ascending: true })

    const { data: strategies, error } = await query

    if (error) {
      console.error('Error fetching strategies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch strategies' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: strategies as ProductStrategyWithOwner[] })
  } catch (error) {
    console.error('Strategies GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/strategies
 *
 * Create a new strategy.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body: CreateStrategyRequest = await req.json()

    const {
      team_id,
      workspace_id,
      type,
      parent_id,
      title,
      description,
      start_date,
      target_date,
      status = 'active',
      progress_mode = 'auto',
      metric_name,
      metric_current,
      metric_target,
      metric_unit,
      owner_id,
      color,
      sort_order = 0,
    } = body

    if (!team_id || !type || !title) {
      return NextResponse.json(
        { error: 'team_id, type, and title are required' },
        { status: 400 }
      )
    }

    // Validate team membership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Validate parent hierarchy if parent_id provided
    if (parent_id) {
      const { data: parentStrategy } = await supabase
        .from('product_strategies')
        .select('type, team_id')
        .eq('id', parent_id)
        .single()

      if (!parentStrategy) {
        return NextResponse.json(
          { error: 'Parent strategy not found' },
          { status: 404 }
        )
      }

      if (parentStrategy.team_id !== team_id) {
        return NextResponse.json(
          { error: 'Parent strategy must be in the same team' },
          { status: 400 }
        )
      }

      // Validate hierarchy: child type must be "below" parent type
      const typeOrder = { pillar: 0, objective: 1, key_result: 2, initiative: 3 }
      if (typeOrder[type] <= typeOrder[parentStrategy.type as StrategyType]) {
        return NextResponse.json(
          { error: `${type} cannot be a child of ${parentStrategy.type}` },
          { status: 400 }
        )
      }
    }

    // Generate timestamp-based ID
    const id = Date.now().toString()

    // Create strategy
    const { data: strategy, error: createError } = await supabase
      .from('product_strategies')
      .insert({
        id,
        team_id,
        workspace_id: workspace_id || null,
        type,
        parent_id: parent_id || null,
        title,
        description: description || null,
        start_date: start_date || null,
        target_date: target_date || null,
        status,
        progress: 0,
        progress_mode,
        calculated_progress: 0,
        metric_name: metric_name || null,
        metric_current: metric_current ?? null,
        metric_target: metric_target ?? null,
        metric_unit: metric_unit || null,
        owner_id: owner_id || null,
        color: color || '#6366f1',
        sort_order,
      })
      .select(`
        *,
        owner:users!product_strategies_owner_id_fkey(id, name, email, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error creating strategy:', createError)
      return NextResponse.json(
        { error: 'Failed to create strategy' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: strategy }, { status: 201 })
  } catch (error) {
    console.error('Strategies POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
