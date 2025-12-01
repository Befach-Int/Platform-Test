'use client'

/**
 * StrategyTree Component
 *
 * Hierarchical tree view of strategies with:
 * - Expand/collapse nodes
 * - Progress bars per level
 * - Color-coded by type
 * - Selection support
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ChevronRight,
  ChevronDown,
  Flag,
  Target,
  TrendingUp,
  Lightbulb,
  Link2,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StrategyProgressCompact } from './strategy-progress'
import {
  getStrategyTypeLabel,
  STRATEGY_TYPE_COLORS,
} from '@/lib/types/strategy'
import type { StrategyWithChildren } from '@/lib/types/strategy'

interface StrategyTreeProps {
  strategies: StrategyWithChildren[]
  selectedId?: string | null
  onSelect?: (strategy: StrategyWithChildren) => void
  onEdit?: (strategy: StrategyWithChildren) => void
  onDelete?: (strategy: StrategyWithChildren) => void
  onAddChild?: (parent: StrategyWithChildren) => void
  defaultExpanded?: boolean
  className?: string
}

export function StrategyTree({
  strategies,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  defaultExpanded = true,
  className,
}: StrategyTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (defaultExpanded) {
      // Expand all nodes by default
      const ids = new Set<string>()
      const collectIds = (items: StrategyWithChildren[]) => {
        items.forEach(item => {
          if (item.children.length > 0) {
            ids.add(item.id)
            collectIds(item.children)
          }
        })
      }
      collectIds(strategies)
      return ids
    }
    return new Set()
  })

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const ids = new Set<string>()
    const collectIds = (items: StrategyWithChildren[]) => {
      items.forEach(item => {
        if (item.children.length > 0) {
          ids.add(item.id)
          collectIds(item.children)
        }
      })
    }
    collectIds(strategies)
    setExpandedIds(ids)
  }, [strategies])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  if (strategies.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No strategies yet</p>
        <p className="text-sm">Create your first pillar to get started</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Controls */}
      <div className="flex justify-end gap-2 mb-2">
        <Button variant="ghost" size="sm" onClick={expandAll}>
          Expand all
        </Button>
        <Button variant="ghost" size="sm" onClick={collapseAll}>
          Collapse all
        </Button>
      </div>

      {/* Tree */}
      {strategies.map(strategy => (
        <StrategyTreeNode
          key={strategy.id}
          strategy={strategy}
          depth={0}
          isExpanded={expandedIds.has(strategy.id)}
          isSelected={selectedId === strategy.id}
          onToggle={() => toggleExpanded(strategy.id)}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          expandedIds={expandedIds}
          selectedId={selectedId}
          setExpandedIds={setExpandedIds}
        />
      ))}
    </div>
  )
}

interface StrategyTreeNodeProps {
  strategy: StrategyWithChildren
  depth: number
  isExpanded: boolean
  isSelected: boolean
  onToggle: () => void
  onSelect?: (strategy: StrategyWithChildren) => void
  onEdit?: (strategy: StrategyWithChildren) => void
  onDelete?: (strategy: StrategyWithChildren) => void
  onAddChild?: (parent: StrategyWithChildren) => void
  expandedIds: Set<string>
  selectedId?: string | null
  setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>
}

function StrategyTreeNode({
  strategy,
  depth,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  expandedIds,
  selectedId,
  setExpandedIds,
}: StrategyTreeNodeProps) {
  const hasChildren = strategy.children.length > 0

  // Type icon mapping
  const TypeIcon = {
    pillar: Flag,
    objective: Target,
    key_result: TrendingUp,
    initiative: Lightbulb,
  }[strategy.type]

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle()
  }

  const handleSelect = () => {
    onSelect?.(strategy)
  }

  return (
    <div>
      <Collapsible open={isExpanded}>
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group',
            isSelected && 'bg-accent ring-1 ring-primary/20'
          )}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={handleSelect}
        >
          {/* Expand/collapse button */}
          {hasChildren ? (
            <CollapsibleTrigger asChild onClick={handleToggle}>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-5 h-5 shrink-0" />
          )}

          {/* Color indicator */}
          <div
            className="w-1.5 h-5 rounded-full shrink-0"
            style={{ backgroundColor: strategy.color }}
          />

          {/* Type icon */}
          <div
            className="p-1 rounded shrink-0"
            style={{ backgroundColor: `${STRATEGY_TYPE_COLORS[strategy.type]}15` }}
          >
            <TypeIcon
              className="h-3.5 w-3.5"
              style={{ color: STRATEGY_TYPE_COLORS[strategy.type] }}
            />
          </div>

          {/* Title */}
          <span className="flex-1 text-sm font-medium truncate">
            {strategy.title}
          </span>

          {/* Aligned items count */}
          {(strategy.aligned_work_items_count || 0) > 0 && (
            <Badge variant="outline" className="text-xs h-5 px-1.5 shrink-0">
              <Link2 className="h-3 w-3 mr-1" />
              {strategy.aligned_work_items_count}
            </Badge>
          )}

          {/* Progress */}
          <div className="w-24 shrink-0">
            <StrategyProgressCompact
              progress={strategy.progress}
              calculatedProgress={strategy.calculated_progress}
              progressMode={strategy.progress_mode}
              status={strategy.status}
            />
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(strategy)}>
                  Edit
                </DropdownMenuItem>
              )}
              {onAddChild && strategy.type !== 'initiative' && (
                <DropdownMenuItem onClick={() => onAddChild(strategy)}>
                  Add child
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(strategy)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {hasChildren && (
          <CollapsibleContent>
            <div className="border-l border-muted ml-4">
              {strategy.children.map(child => (
                <StrategyTreeNode
                  key={child.id}
                  strategy={child}
                  depth={depth + 1}
                  isExpanded={expandedIds.has(child.id)}
                  isSelected={selectedId === child.id}
                  onToggle={() => {
                    setExpandedIds(prev => {
                      const next = new Set(prev)
                      if (next.has(child.id)) {
                        next.delete(child.id)
                      } else {
                        next.add(child.id)
                      }
                      return next
                    })
                  }}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                  expandedIds={expandedIds}
                  selectedId={selectedId}
                  setExpandedIds={setExpandedIds}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}

/**
 * Simple tree for read-only display
 */
export function StrategyTreeReadOnly({
  strategies,
  className,
}: Pick<StrategyTreeProps, 'strategies' | 'className'>) {
  return (
    <StrategyTree
      strategies={strategies}
      defaultExpanded
      className={className}
    />
  )
}
