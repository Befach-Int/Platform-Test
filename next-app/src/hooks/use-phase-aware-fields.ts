import { useMemo } from 'react'
import { isFieldVisibleInPhase, isFieldLockedInPhase, WorkspacePhase, migrateLifecyclePhase } from '@/lib/constants/work-item-types'

/**
 * Field group visibility and lock status
 */
export interface FieldGroupStatus {
  /** Whether the field group is visible in the current phase */
  visible: boolean
  /** Whether the field group is locked (read-only) in the current phase */
  locked: boolean
}

/**
 * Return type for usePhaseAwareFields hook
 */
export interface PhaseAwareFieldsResult {
  /** Array of field names visible in the current phase */
  visibleFields: string[]
  /** Array of field names locked (read-only) in the current phase */
  lockedFields: string[]
  /** Visibility and lock status for each field group */
  fieldGroups: {
    basic: FieldGroupStatus
    design: FieldGroupStatus
    build: FieldGroupStatus
  }
}

/**
 * Hook for managing phase-aware field visibility and locking
 *
 * Updated 2025-12-13: Migrated to 4-phase system
 * - design (was research/planning)
 * - build (was execution)
 * - refine (was review)
 * - launch (was complete)
 *
 * Field visibility rules:
 * - **Basic fields**: Always visible, never locked (name, purpose, tags, type)
 * - **Design fields**: Visible from design phase onwards, locked from build onwards
 * - **Build fields**: Visible from build phase onwards, never locked
 *
 * @param phase - Current workspace phase (supports both new and legacy values)
 * @returns Object containing visible fields, locked fields, and field group status
 *
 * @example
 * ```tsx
 * const { visibleFields, lockedFields, fieldGroups } = usePhaseAwareFields('design')
 *
 * // Check if field is visible
 * const showEstimate = visibleFields.includes('estimated_hours')
 *
 * // Check if field is locked
 * const isEstimateLocked = lockedFields.includes('estimated_hours')
 *
 * // Check if entire group is visible
 * if (fieldGroups.design.visible) {
 *   // Show design section
 * }
 * ```
 */
export function usePhaseAwareFields(phase: WorkspacePhase | string): PhaseAwareFieldsResult {
  return useMemo(() => {
    // Migrate legacy phases to new phases
    const normalizedPhase = migrateLifecyclePhase(phase)

    // Define field groups
    const basicFields = ['name', 'purpose', 'tags', 'type']
    const designFields = [
      'target_release',
      'acceptance_criteria',
      'business_value',
      'customer_impact',
      'strategic_alignment',
      'estimated_hours',
      'priority',
      'stakeholders',
    ]
    const buildFields = [
      'actual_start_date',
      'actual_end_date',
      'actual_hours',
      'progress_percent',
      'blockers',
    ]

    // Combine all fields
    const allFields = [...basicFields, ...designFields, ...buildFields]

    // Calculate visibility and locking for each field
    const visibleFields = allFields.filter(field => isFieldVisibleInPhase(field, normalizedPhase))
    const lockedFields = allFields.filter(field => isFieldLockedInPhase(field, normalizedPhase))

    // Calculate field group status
    // All phases: design, build, refine, launch
    // Design fields visible from design onwards, locked from build onwards
    // Build fields visible from build onwards, never locked (except in launch)
    const designPhasesAndAfter: WorkspacePhase[] = ['design', 'build', 'refine', 'launch']
    const buildPhasesAndAfter: WorkspacePhase[] = ['build', 'refine', 'launch']
    const lockedPhasesForDesign: WorkspacePhase[] = ['build', 'refine', 'launch']

    const fieldGroups: PhaseAwareFieldsResult['fieldGroups'] = {
      basic: {
        visible: true, // Always visible
        locked: normalizedPhase === 'launch', // Only locked in launch phase
      },
      design: {
        visible: designPhasesAndAfter.includes(normalizedPhase),
        locked: lockedPhasesForDesign.includes(normalizedPhase),
      },
      build: {
        visible: buildPhasesAndAfter.includes(normalizedPhase),
        locked: normalizedPhase === 'launch', // Only locked in launch phase
      },
    }

    return {
      visibleFields,
      lockedFields,
      fieldGroups,
    }
  }, [phase])
}

/**
 * Helper function to check if a specific field is visible
 *
 * @param field - Field name to check
 * @param phase - Current workspace phase
 * @returns True if field is visible in the current phase
 *
 * @example
 * ```tsx
 * if (isFieldVisible('estimated_hours', 'planning')) {
 *   // Show estimated hours field
 * }
 * ```
 */
export function isFieldVisible(field: string, phase: WorkspacePhase): boolean {
  return isFieldVisibleInPhase(field, phase)
}

/**
 * Helper function to check if a specific field is locked
 *
 * @param field - Field name to check
 * @param phase - Current workspace phase
 * @returns True if field is locked (read-only) in the current phase
 *
 * @example
 * ```tsx
 * const isLocked = isFieldLocked('acceptance_criteria', 'execution')
 * <Input disabled={isLocked} />
 * ```
 */
export function isFieldLocked(field: string, phase: WorkspacePhase): boolean {
  return isFieldLockedInPhase(field, phase)
}

/**
 * Get all field names for a specific group
 *
 * Updated 2025-12-13: Renamed groups to match 4-phase system
 * - basic (unchanged)
 * - design (was planning)
 * - build (was execution)
 *
 * @param group - Field group name ('basic' | 'design' | 'build')
 * @returns Array of field names in the group
 *
 * @example
 * ```tsx
 * const designFields = getFieldsByGroup('design')
 * // ['target_release', 'acceptance_criteria', ...]
 * ```
 */
export function getFieldsByGroup(group: 'basic' | 'design' | 'build'): string[] {
  const fieldGroups = {
    basic: ['name', 'purpose', 'tags', 'type'],
    design: [
      'target_release',
      'acceptance_criteria',
      'business_value',
      'customer_impact',
      'strategic_alignment',
      'estimated_hours',
      'priority',
      'stakeholders',
    ],
    build: [
      'actual_start_date',
      'actual_end_date',
      'actual_hours',
      'progress_percent',
      'blockers',
    ],
  }

  return fieldGroups[group] || []
}

/**
 * Get human-readable label for a field group
 *
 * @param group - Field group name
 * @returns Display label for the group
 *
 * @example
 * ```tsx
 * <h3>{getFieldGroupLabel('design')}</h3>
 * // Renders: "Design Details"
 * ```
 */
export function getFieldGroupLabel(group: 'basic' | 'design' | 'build'): string {
  const labels = {
    basic: 'Basic Information',
    design: 'Design Details',
    build: 'Build Tracking',
  }

  return labels[group] || group
}

/**
 * Get helper text explaining field group visibility rules
 *
 * Updated 2025-12-13: Uses 4-phase terminology
 *
 * @param group - Field group name
 * @returns Description of when the group is visible/locked
 *
 * @example
 * ```tsx
 * <p className="text-sm text-muted-foreground">
 *   {getFieldGroupHelperText('design')}
 * </p>
 * ```
 */
export function getFieldGroupHelperText(group: 'basic' | 'design' | 'build'): string {
  const helperTexts = {
    basic: 'Always visible and editable in all phases (locked in Launch)',
    design: 'Visible from Design phase onwards, locked from Build phase onwards',
    build: 'Visible from Build phase onwards, locked only in Launch phase',
  }

  return helperTexts[group] || ''
}
