'use client'

import { Badge } from '@/components/ui/badge'
import { WorkspacePhase, migrateLifecyclePhase } from '@/lib/constants/work-item-types'
import { PHASE_CONFIG } from '@/lib/constants/workspace-phases'
import { usePhaseAwareFields } from '@/hooks/use-phase-aware-fields'
import { cn } from '@/lib/utils'

interface PhaseContextBadgeProps {
  phase: WorkspacePhase | string
  showFieldCount?: boolean
  className?: string
}

/**
 * Display badge showing the current workspace phase with appropriate styling
 *
 * Updated 2025-12-13: Migrated to 4-phase system
 * - design (was research/planning)
 * - build (was execution)
 * - refine (was review)
 * - launch (was complete)
 *
 * Features:
 * - Phase-specific colors matching workspace design system
 * - Optional field count display
 * - Supports both new and legacy phase values
 *
 * @example
 * ```tsx
 * <PhaseContextBadge phase="design" />
 * <PhaseContextBadge phase="build" showFieldCount={false} />
 * ```
 */
export function PhaseContextBadge({
  phase,
  showFieldCount = true,
  className
}: PhaseContextBadgeProps) {
  // Migrate legacy phases to new phases
  const normalizedPhase = migrateLifecyclePhase(phase)
  const { visibleFields } = usePhaseAwareFields(normalizedPhase)

  // Get phase config from constants
  const phaseInfo = PHASE_CONFIG[normalizedPhase]

  // Phase-specific styling matching workspace design system
  // Using Violet → Emerald → Amber → Green progression
  const phaseStyles: Record<WorkspacePhase, string> = {
    design: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
    build: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    refine: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    launch: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        className={cn(
          'font-medium',
          phaseStyles[normalizedPhase]
        )}
        title={phaseInfo.description}
      >
        {phaseInfo.emoji} {phaseInfo.name}
      </Badge>
      {showFieldCount && (
        <span className="text-xs text-muted-foreground">
          {visibleFields.length} field{visibleFields.length !== 1 ? 's' : ''} available
        </span>
      )}
    </div>
  )
}
