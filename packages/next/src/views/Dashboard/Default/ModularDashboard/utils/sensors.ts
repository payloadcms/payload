import type { KeyboardSensorOptions } from '@dnd-kit/core'

import { KeyboardCode, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'

/**
 * Custom KeyboardSensor that only activates when focus is directly on the
 * draggable element, not on any of its descendants. This allows interactive
 * elements inside draggables (like buttons) to work normally with the keyboard.
 */
class DirectFocusKeyboardSensor extends KeyboardSensor {
  static override activators = [
    {
      eventName: 'onKeyDown' as const,
      handler: (
        event: React.KeyboardEvent,
        {
          keyboardCodes = {
            cancel: [KeyboardCode.Esc],
            end: [KeyboardCode.Space, KeyboardCode.Enter],
            start: [KeyboardCode.Space, KeyboardCode.Enter],
          },
          onActivation,
        }: KeyboardSensorOptions,
        { active }: { active: { node: React.MutableRefObject<HTMLElement | null> } },
      ) => {
        const { code } = event.nativeEvent

        // Only activate if focus is directly on the draggable node, not descendants
        if (event.target !== active.node.current) {
          return false
        }

        if (keyboardCodes.start.includes(code)) {
          event.preventDefault()
          onActivation?.({ event: event.nativeEvent })
          return true
        }

        return false
      },
    },
  ]
}

export function useDashboardSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(DirectFocusKeyboardSensor, {
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
