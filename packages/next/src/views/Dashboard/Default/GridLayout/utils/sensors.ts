import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
/**
 * Hook to configure sensors for drag and drop with sortableKeyboardCoordinates
 * to jump to next item instead of moving 25px
 * See: https://docs.dndkit.com/presets/sortable#sensors
 *
 */
export function useDashboardSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
}
