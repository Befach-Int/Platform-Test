'use client'

/**
 * StrategyCard Component
 *
 * Card displaying a single strategy with:
 * - Type badge (color-coded)
 * - Progress bar (hybrid mode)
 * - Aligned work items count
 * - Owner avatar
 * - Dates
 */

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Calendar, Link2, Target, TrendingUp, Flag, Lightbulb } from 'lucide-react'
import { StrategyProgress } from './strategy-progress'
import {
  getStrategyTypeLabel,
  getStrategyTypeShortLabel,
  getStrategyStatusLabel,
  STRATEGY_TYPE_COLORS,
} from '@/lib/types/strategy'
import type { ProductStrategyWithOwner, StrategyWithChildren } from '@/lib/types/strategy'

interface StrategyCardProps {
  strategy: ProductStrategyWithOwner | StrategyWithChildren
  onClick?: () => void
  isSelected?: boolean
  showMetrics?: boolean
  showDates?: boolean
  className?: string
}

export function StrategyCard({
  strategy,
  onClick,
  isSelected = false,
  showMetrics = true,
  showDates = true,
  className,
}: StrategyCardProps) {
  const alignedCount = 'aligned_work_items_count' in strategy
    ? strategy.aligned_work_items_count || 0
    : 0

  // Type icon mapping
  const TypeIcon = {
    pillar: Flag,
    objective: Target,
    key_result: TrendingUp,
    initiative: Lightbulb,
  }[strategy.type]

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Get owner initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer hover:shadow-md',
        isSelected && 'ring-2 ring-primary',
        className
      )}
      onClick={onClick}
      style={{ borderLeftColor: strategy.color, borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Type badge */}
            <Badge
              variant="secondary"
              className="shrink-0"
              style={{
                backgroundColor: `${STRATEGY_TYPE_COLORS[strategy.type]}20`,
                color: STRATEGY_TYPE_COLORS[strategy.type],
              }}
            >
              <TypeIcon className="h-3 w-3 mr-1" />
              {getStrategyTypeShortLabel(strategy.type)}
            </Badge>

            {/* Status badge */}
            {strategy.status !== 'active' && (
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 text-xs',
                  strategy.status === 'completed' && 'border-green-300 text-green-700',
                  strategy.status === 'on_hold' && 'border-yellow-300 text-yellow-700',
                  strategy.status === 'cancelled' && 'border-gray-300 text-gray-500',
                  strategy.status === 'draft' && 'border-gray-300 text-gray-500'
                )}
              >
                {getStrategyStatusLabel(strategy.status)}
              </Badge>
            )}
          </div>

          {/* Owner avatar */}
          {strategy.owner && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10">
                      {getInitials(strategy.owner.name)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{strategy.owner.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Title */}
        <h3 className="font-medium text-sm mt-2 line-clamp-2">{strategy.title}</h3>

        {/* Description */}
        {strategy.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {strategy.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Progress */}
        <StrategyProgress
          progress={strategy.progress}
          calculatedProgress={strategy.calculated_progress}
          progressMode={strategy.progress_mode}
          status={strategy.status}
          showMode
          size="sm"
        />

        {/* Metrics (for Key Results) */}
        {showMetrics && strategy.type === 'key_result' && strategy.metric_name && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
            <span className="font-medium">{strategy.metric_name}:</span>{' '}
            {strategy.metric_current ?? 0} / {strategy.metric_target ?? '?'}
            {strategy.metric_unit && ` ${strategy.metric_unit}`}
          </div>
        )}

        {/* Footer: Dates + Aligned count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {/* Dates */}
          {showDates && (strategy.start_date || strategy.target_date) ? (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(strategy.start_date)}
              {strategy.start_date && strategy.target_date && ' → '}
              {formatDate(strategy.target_date)}
            </div>
          ) : (
            <div />
          )}

          {/* Aligned work items */}
          {alignedCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-primary">
                    <Link2 className="h-3 w-3" />
                    <span>{alignedCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{alignedCount} aligned work item{alignedCount !== 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact card variant for list views
 */
export function StrategyCardCompact({
  strategy,
  onClick,
  isSelected = false,
}: Pick<StrategyCardProps, 'strategy' | 'onClick' | 'isSelected'>) {
  const TypeIcon = {
    pillar: Flag,
    objective: Target,
    key_result: TrendingUp,
    initiative: Lightbulb,
  }[strategy.type]

  const displayProgress = strategy.progress_mode === 'auto'
    ? strategy.calculated_progress
    : strategy.progress

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors',
        isSelected && 'ring-2 ring-primary bg-accent/50'
      )}
      onClick={onClick}
      style={{ borderLeftColor: strategy.color, borderLeftWidth: '3px' }}
    >
      {/* Type icon */}
      <div
        className="p-1.5 rounded"
        style={{ backgroundColor: `${STRATEGY_TYPE_COLORS[strategy.type]}20` }}
      >
        <TypeIcon
          className="h-4 w-4"
          style={{ color: STRATEGY_TYPE_COLORS[strategy.type] }}
        />
      </div>

      {/* Title + type */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{strategy.title}</p>
        <p className="text-xs text-muted-foreground">
          {getStrategyTypeLabel(strategy.type)}
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-20">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all',
                displayProgress >= 70 ? 'bg-green-500' :
                displayProgress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-muted-foreground w-8 text-right">
          {displayProgress}%
        </span>
      </div>
    </div>
  )
}
