/**
 * Strategy Tree API Route
 *
 * GET /api/strategies/tree - Get full hierarchical strategy tree
 *
 * Returns strategies as a nested tree structure for workspace/team.
 * Includes alignment counts for each strategy.
 *
 * Security: Team-based RLS with team membership validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  StrategyWithChildren,
  ProductStrategyWithOwner,
  StrategyStatus,
} from '@/lib/types/strategy'

/**
 * GET /api/strategies/tree
 *
 * Get hierarchical strategy tree.
 * Query params:
 * - team_id (required)
 * - workspace_id (optional)
 * - status (optional): filter by status
 * - include_completed (optional): include completed/cancelled strategies
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const teamId = searchParams.get('team_id')
    const workspaceId = searchParams.get('workspace_id')
    const status = searchParams.get('status') as StrategyStatus | null
    const includeCompleted = searchParams.get('include_completed') === 'true'

    if (!teamId) {
      return NextResponse.json(
        { error: 'team_id is required' },
        { status: 400 }
      )
    }

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Build query for all strategies
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

    if (status) {
      query = query.eq('status', status)
    } else if (!includeCompleted) {
      // By default, exclude completed and cancelled
      query = query.not('status', 'in', '("completed","cancelled")')
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

    // Get alignment counts for all strategies
    const strategyIds = strategies?.map(s => s.id) || []

    // Primary alignments (work_items.strategy_id)
    const { data: primaryCounts } = await supabase
      .from('work_items')
      .select('strategy_id')
      .in('strategy_id', strategyIds)

    // Additional alignments (work_item_strategies)
    const { data: additionalCounts } = await supabase
      .from('work_item_strategies')
      .select('strategy_id')
      .in('strategy_id', strategyIds)

    // Build count map (combine primary + additional, deduplicate later if needed)
    const countMap = new Map<string, number>()
    primaryCounts?.forEach(item => {
      if (item.strategy_id) {
        countMap.set(item.strategy_id, (countMap.get(item.strategy_id) || 0) + 1)
      }
    })
    additionalCounts?.forEach(item => {
      countMap.set(item.strategy_id, (countMap.get(item.strategy_id) || 0) + 1)
    })

    // Build tree structure
    const buildTree = (
      items: ProductStrategyWithOwner[],
      parentId: string | null = null
    ): StrategyWithChildren[] => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id),
          aligned_work_items_count: countMap.get(item.id) || 0,
        }))
    }

    const tree = buildTree(strategies as ProductStrategyWithOwner[])

    // Calculate total count (for pagination purposes if needed)
    const totalCount = strategies?.length || 0

    return NextResponse.json({
      data: tree,
      total_count: totalCount,
    })
  } catch (error) {
    console.error('Strategy tree GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
