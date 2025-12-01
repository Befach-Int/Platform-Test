'use client'

/**
 * Strategies Page
 *
 * Displays the hierarchical OKR/Pillar strategy system for a workspace.
 * Shows strategies in a tree view with progress tracking and work item alignment.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Target, TreePine, List, RefreshCw } from 'lucide-react'
import { StrategyTree } from '@/components/strategy/strategy-tree'
import { StrategyForm } from '@/components/strategy/strategy-form'
import { StrategyCard } from '@/components/strategy/strategy-card'
import type {
  StrategyWithChildren,
  CreateStrategyRequest,
  UpdateStrategyRequest,
  StrategyType,
} from '@/lib/types/strategy'

type ViewMode = 'tree' | 'list'

export default function StrategiesPage() {
  const params = useParams()
  const workspaceId = params.id as string

  const [strategies, setStrategies] = useState<StrategyWithChildren[]>([])
  const [teamId, setTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<StrategyWithChildren | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<StrategyType>('pillar')

  // Fetch team ID from workspace
  useEffect(() => {
    async function fetchTeamId() {
      const supabase = createClient()
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('team_id')
        .eq('id', workspaceId)
        .single()

      if (workspace?.team_id) {
        setTeamId(workspace.team_id)
      }
    }
    fetchTeamId()
  }, [workspaceId])

  // Fetch strategies
  const fetchStrategies = useCallback(async () => {
    if (!teamId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/strategies/tree?team_id=${teamId}&workspace_id=${workspaceId}`
      )
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch strategies')
      }

      setStrategies(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [teamId, workspaceId])

  useEffect(() => {
    if (teamId) {
      fetchStrategies()
    }
  }, [teamId, fetchStrategies])

  // Create strategy (accepts union type to match form callback signature)
  const handleCreate = async (data: CreateStrategyRequest | UpdateStrategyRequest) => {
    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          team_id: teamId,
          workspace_id: workspaceId,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to create strategy')
      }

      setCreateDialogOpen(false)
      setSelectedParentId(null)
      fetchStrategies()
    } catch (err) {
      console.error('Error creating strategy:', err)
    }
  }

  // Update strategy
  const handleUpdate = async (id: string, data: UpdateStrategyRequest) => {
    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to update strategy')
      }

      setEditingStrategy(null)
      fetchStrategies()
    } catch (err) {
      console.error('Error updating strategy:', err)
    }
  }

  // Delete strategy (takes StrategyWithChildren to match tree component)
  const handleDelete = async (strategy: StrategyWithChildren) => {
    if (!confirm('Are you sure you want to delete this strategy? This will also delete all child strategies.')) {
      return
    }

    try {
      const response = await fetch(`/api/strategies/${strategy.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete strategy')
      }

      fetchStrategies()
    } catch (err) {
      console.error('Error deleting strategy:', err)
    }
  }

  // Add child strategy (takes parent StrategyWithChildren to match tree component)
  const handleAddChild = (parent: StrategyWithChildren) => {
    // Determine the child type based on parent type
    const childTypeMap: Record<StrategyType, StrategyType> = {
      pillar: 'objective',
      objective: 'key_result',
      key_result: 'initiative',
      initiative: 'initiative', // Can't go lower
    }
    setSelectedParentId(parent.id)
    setSelectedType(childTypeMap[parent.type])
    setCreateDialogOpen(true)
  }

  // Flatten strategies for list view
  const flattenStrategies = (items: StrategyWithChildren[]): StrategyWithChildren[] => {
    const result: StrategyWithChildren[] = []
    const flatten = (list: StrategyWithChildren[]) => {
      list.forEach(item => {
        result.push(item)
        if (item.children?.length) {
          flatten(item.children)
        }
      })
    }
    flatten(items)
    return result
  }

  // Calculate summary stats
  const stats = {
    pillars: strategies.length,
    objectives: strategies.reduce((acc, p) => acc + (p.children?.length || 0), 0),
    keyResults: strategies.reduce((acc, p) =>
      acc + (p.children?.reduce((a, o) => a + (o.children?.length || 0), 0) || 0), 0),
    avgProgress: strategies.length > 0
      ? Math.round(strategies.reduce((acc, s) =>
          acc + (s.progress_mode === 'auto' ? s.calculated_progress : s.progress), 0) / strategies.length)
      : 0,
  }

  if (loading && !strategies.length) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold">Product Strategy</h1>
            <p className="text-sm text-muted-foreground">
              OKRs, Pillars, and Strategic Alignment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStrategies}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedParentId(null)
                setSelectedType('pillar')
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedParentId ? `Add ${selectedType.replace('_', ' ')}` : 'Create Strategy'}
                </DialogTitle>
              </DialogHeader>
              <StrategyForm
                mode="create"
                teamId={teamId!}
                workspaceId={workspaceId}
                parentStrategies={strategies}
                defaultParentId={selectedParentId || undefined}
                defaultType={selectedType}
                onSubmit={handleCreate}
                onCancel={() => {
                  setCreateDialogOpen(false)
                  setSelectedParentId(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.pillars}</div>
            <p className="text-sm text-muted-foreground">Pillars</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.objectives}</div>
            <p className="text-sm text-muted-foreground">Objectives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.keyResults}</div>
            <p className="text-sm text-muted-foreground">Key Results</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.avgProgress}%</div>
            <p className="text-sm text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* View Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="tree" className="gap-2">
              <TreePine className="h-4 w-4" />
              Tree View
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline" className="text-muted-foreground">
            {flattenStrategies(strategies).length} total strategies
          </Badge>
        </div>

        <TabsContent value="tree" className="mt-4">
          {strategies.length === 0 ? (
            <Card className="p-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No strategies yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first pillar to start building your product strategy.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Pillar
              </Button>
            </Card>
          ) : (
            <StrategyTree
              strategies={strategies}
              onEdit={setEditingStrategy}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
            />
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <div className="grid gap-4">
            {flattenStrategies(strategies).map(strategy => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onClick={() => setEditingStrategy(strategy)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingStrategy && (
        <Dialog open={!!editingStrategy} onOpenChange={() => setEditingStrategy(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Strategy</DialogTitle>
            </DialogHeader>
            <StrategyForm
              mode="edit"
              strategy={editingStrategy}
              teamId={teamId!}
              workspaceId={workspaceId}
              parentStrategies={strategies}
              onSubmit={(data) => handleUpdate(editingStrategy.id, data)}
              onCancel={() => setEditingStrategy(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
