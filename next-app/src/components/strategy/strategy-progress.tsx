'use client'

/**
 * StrategyProgress Component
 *
 * Displays progress bar with hybrid mode support (auto/manual).
 * Shows different colors based on progress and status.
 */

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Calculator, Pencil } from 'lucide-react'
import type { ProgressMode, StrategyStatus } from '@/lib/types/strategy'

interface StrategyProgressProps {
  progress: number
  calculatedProgress: number
  progressMode: ProgressMode
  status: StrategyStatus
  showMode?: boolean
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StrategyProgress({
  progress,
  calculatedProgress,
  progressMode,
  status,
  showMode = false,
  showPercentage = true,
  size = 'md',
  className,
}: StrategyProgressProps) {
  // Determine which progress value to display
  const displayProgress = progressMode === 'auto' ? calculatedProgress : progress

  // Get progress bar color based on status and progress
  const getProgressColor = () => {
    if (status === 'completed') return 'bg-green-500'
    if (status === 'cancelled') return 'bg-gray-400'
    if (status === 'on_hold') return 'bg-yellow-500'
    if (status === 'draft') return 'bg-gray-300'

    // Active status - color by progress
    if (displayProgress >= 70) return 'bg-green-500'
    if (displayProgress >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Size variants
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const percentageSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-medium',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1">
        <Progress
          value={displayProgress}
          className={cn(sizeClasses[size])}
          indicatorClassName={getProgressColor()}
        />
      </div>

      {showPercentage && (
        <span className={cn('text-muted-foreground min-w-[3ch] text-right', percentageSizeClasses[size])}>
          {displayProgress}%
        </span>
      )}

      {showMode && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  'px-1.5 py-0.5 text-xs cursor-help',
                  progressMode === 'auto' ? 'text-blue-600 border-blue-300' : 'text-purple-600 border-purple-300'
                )}
              >
                {progressMode === 'auto' ? (
                  <Calculator className="h-3 w-3" />
                ) : (
                  <Pencil className="h-3 w-3" />
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {progressMode === 'auto' ? (
                <div className="text-xs">
                  <p className="font-medium">Auto-calculated</p>
                  <p className="text-muted-foreground">Progress computed from children or metrics</p>
                </div>
              ) : (
                <div className="text-xs">
                  <p className="font-medium">Manual override</p>
                  <p className="text-muted-foreground">
                    Auto: {calculatedProgress}% | Manual: {progress}%
                  </p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

/**
 * Compact version for list views
 */
export function StrategyProgressCompact({
  progress,
  calculatedProgress,
  progressMode,
  status,
}: Omit<StrategyProgressProps, 'showMode' | 'showPercentage' | 'size' | 'className'>) {
  const displayProgress = progressMode === 'auto' ? calculatedProgress : progress

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16">
        <Progress
          value={displayProgress}
          className="h-1.5"
          indicatorClassName={
            status === 'completed' ? 'bg-green-500' :
            displayProgress >= 70 ? 'bg-green-500' :
            displayProgress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
          }
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{displayProgress}%</span>
    </div>
  )
}
