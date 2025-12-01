/**
 * Strategy [id] API Routes
 *
 * Single strategy operations
 *
 * GET    /api/strategies/[id] - Get strategy with children and alignments
 * PATCH  /api/strategies/[id] - Update strategy
 * DELETE /api/strategies/[id] - Delete strategy (cascades to children)
 *
 * Security: Team-based RLS with team membership validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  UpdateStrategyRequest,
  StrategyWithChildren,
  WorkItemStrategyWithWorkItem,
  StrategyType,
} from '@/lib/types/strategy'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/strategies/[id]
 *
 * Get single strategy with children and aligned work items
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch strategy with owner
    const { data: strategy, error: strategyError } = await supabase
      .from('product_strategies')
      .select(`
        *,
        owner:users!product_strategies_owner_id_fkey(id, name, email, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (strategyError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 })
    }

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', strategy.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Fetch children recursively
    const { data: allStrategies } = await supabase
      .from('product_strategies')
      .select(`
        *,
        owner:users!product_strategies_owner_id_fkey(id, name, email, avatar_url)
      `)
      .eq('team_id', strategy.team_id)
      .order('sort_order', { ascending: true })

    // Build tree starting from this strategy
    const buildSubtree = (parentId: string): StrategyWithChildren[] => {
      const children = (allStrategies || [])
        .filter(s => s.parent_id === parentId)
        .map(child => ({
          ...child,
          children: buildSubtree(child.id),
          aligned_work_items_count: 0,
        }))
      return children
    }

    const strategyWithChildren: StrategyWithChildren = {
      ...strategy,
      children: buildSubtree(strategy.id),
      aligned_work_items_count: 0,
    }

    // Fetch aligned work items (both primary and additional)
    // Primary alignments (work_items.strategy_id)
    const { data: primaryAlignments } = await supabase
      .from('work_items')
      .select('id, name, type, status')
      .eq('strategy_id', id)

    // Additional alignments (work_item_strategies junction)
    const { data: additionalAlignments } = await supabase
      .from('work_item_strategies')
      .select(`
        id,
        work_item_id,
        strategy_id,
        alignment_strength,
        notes,
        created_at,
        work_item:work_items!work_item_strategies_work_item_id_fkey(id, name, type, status)
      `)
      .eq('strategy_id', id)

    // Combine and deduplicate alignments
    const alignedWorkItems: WorkItemStrategyWithWorkItem[] = []
    const seenIds = new Set<string>()

    // Add primary alignments first
    primaryAlignments?.forEach(wi => {
      if (!seenIds.has(wi.id)) {
        seenIds.add(wi.id)
        alignedWorkItems.push({
          id: `primary-${wi.id}`,
          work_item_id: wi.id,
          strategy_id: id,
          alignment_strength: 'strong', // Primary is always strong
          notes: null,
          created_at: '',
          work_item: wi,
        })
      }
    })

    // Add additional alignments
    additionalAlignments?.forEach(alignment => {
      if (!seenIds.has(alignment.work_item_id)) {
        seenIds.add(alignment.work_item_id)
        // Cast through unknown to handle Supabase's array type inference for joins
        const workItem = alignment.work_item as unknown as { id: string; name: string; type: string; status: string }
        alignedWorkItems.push({
          ...alignment,
          work_item: workItem,
        })
      }
    })

    strategyWithChildren.aligned_work_items_count = alignedWorkItems.length

    return NextResponse.json({
      data: strategyWithChildren,
      aligned_work_items: alignedWorkItems,
    })
  } catch (error) {
    console.error('Strategy GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/strategies/[id]
 *
 * Update a strategy
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body: UpdateStrategyRequest = await req.json()

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch existing strategy
    const { data: existingStrategy, error: fetchError } = await supabase
      .from('product_strategies')
      .select('team_id, type, parent_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingStrategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 })
    }

    // Validate team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', existingStrategy.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Validate parent hierarchy if changing parent
    if (body.parent_id !== undefined && body.parent_id !== existingStrategy.parent_id) {
      if (body.parent_id === id) {
        return NextResponse.json(
          { error: 'Strategy cannot be its own parent' },
          { status: 400 }
        )
      }

      if (body.parent_id !== null) {
        const { data: newParent } = await supabase
          .from('product_strategies')
          .select('type, team_id')
          .eq('id', body.parent_id)
          .single()

        if (!newParent) {
          return NextResponse.json(
            { error: 'New parent strategy not found' },
            { status: 404 }
          )
        }

        if (newParent.team_id !== existingStrategy.team_id) {
          return NextResponse.json(
            { error: 'Parent must be in the same team' },
            { status: 400 }
          )
        }

        // Validate hierarchy
        const typeOrder = { pillar: 0, objective: 1, key_result: 2, initiative: 3 }
        if (typeOrder[existingStrategy.type as StrategyType] <= typeOrder[newParent.type as StrategyType]) {
          return NextResponse.json(
            { error: `${existingStrategy.type} cannot be a child of ${newParent.type}` },
            { status: 400 }
          )
        }

        // Check for circular reference
        let checkId: string | null = body.parent_id
        while (checkId) {
          if (checkId === id) {
            return NextResponse.json(
              { error: 'Circular reference detected' },
              { status: 400 }
            )
          }
          const result = await supabase
            .from('product_strategies')
            .select('parent_id')
            .eq('id', checkId)
            .single()
          const parentData = result.data as { parent_id: string | null } | null
          checkId = parentData?.parent_id ?? null
        }
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.parent_id !== undefined) updateData.parent_id = body.parent_id
    if (body.start_date !== undefined) updateData.start_date = body.start_date
    if (body.target_date !== undefined) updateData.target_date = body.target_date
    if (body.status !== undefined) updateData.status = body.status
    if (body.progress !== undefined) updateData.progress = body.progress
    if (body.progress_mode !== undefined) updateData.progress_mode = body.progress_mode
    if (body.metric_name !== undefined) updateData.metric_name = body.metric_name
    if (body.metric_current !== undefined) updateData.metric_current = body.metric_current
    if (body.metric_target !== undefined) updateData.metric_target = body.metric_target
    if (body.metric_unit !== undefined) updateData.metric_unit = body.metric_unit
    if (body.owner_id !== undefined) updateData.owner_id = body.owner_id
    if (body.color !== undefined) updateData.color = body.color
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Update strategy
    const { data: updatedStrategy, error: updateError } = await supabase
      .from('product_strategies')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        owner:users!product_strategies_owner_id_fkey(id, name, email, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Error updating strategy:', updateError)
      return NextResponse.json(
        { error: 'Failed to update strategy' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedStrategy })
  } catch (error) {
    console.error('Strategy PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/strategies/[id]
 *
 * Delete a strategy (cascades to children via FK)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Validate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch strategy to get team_id
    const { data: strategy, error: fetchError } = await supabase
      .from('product_strategies')
      .select('team_id')
      .eq('id', id)
      .single()

    if (fetchError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 })
    }

    // Validate team membership (admin or owner required for delete)
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', strategy.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only admins and owners can delete strategies' },
        { status: 403 }
      )
    }

    // Delete strategy (children cascade via FK)
    const { error: deleteError } = await supabase
      .from('product_strategies')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting strategy:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete strategy' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Strategy DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
