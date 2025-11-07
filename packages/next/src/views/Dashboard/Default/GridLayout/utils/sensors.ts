import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'

export function useDashboardSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      // For a better UX, we could make a better coordinateGetter
      // than the default one that moves in 25px increments, so
      // that it jumps directly to another dropableArea, but the
      // complexity isn't worth it.
      // coordinateGetter: (args) => {
      //   // custom logic here
      // },
    }),
  )
}
