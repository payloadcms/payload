import { useDraggable } from '@dnd-kit/core'
import React, { useId, useRef } from 'react'

import './index.scss'

const baseClass = 'draggable-with-click'

type Props = {
  /** The component or HTML element to render as the root element.
   * @default 'div'
   */
  readonly as?: React.ElementType
  /** The content to be rendered inside the component. */
  readonly children?: React.ReactNode
  /**
   * Optional additional class name(s) to apply to the component.
   */
  readonly className?: string
  /**
   * Whether dragging is disabled.
   * @default false
   */
  readonly disabled?: boolean
  /**
   * The distance (in pixels) the pointer must move before a drag is initiated.
   */
  readonly dragThreshold?: number
  /**
   * Callback fired when the element is clicked (pointer down and up without exceeding the drag threshold).
   */
  readonly onClick?: (event: React.MouseEvent<HTMLElement>) => void
  /**
   * Callback fired when a drag is initiated (pointer moves beyond the drag threshold).
   */
  readonly onDrag: (e: PointerEvent) => void
  /**
   * Optional keydown handler for accessibility (e.g., handling Enter or Space to trigger click).
   */
  readonly onKeyDown?: (e: React.KeyboardEvent) => void
  /**
   * Optional ref to access the underlying DOM element.
   */
  readonly ref?: React.RefObject<HTMLDivElement>
}

export const DraggableWithClick = ({
  as = 'div',
  children,
  className,
  disabled = false,
  dragThreshold = 3,
  onClick,
  onDrag,
  onKeyDown,
  ref,
}: Props) => {
  const id = useId()
  const initialPos = useRef({ x: 0, y: 0 })
  const [dragStartX, setDragStartX] = React.useState(0)
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
    data: {
      dragStartX,
    },
    disabled,
  })
  const isDragging = useRef(false)

  const handlePointerDown = (e: PointerEvent) => {
    initialPos.current = { x: e.clientX, y: e.clientY }
    setDragStartX(e.clientX)
    isDragging.current = false

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - initialPos.current.x)
      const deltaY = Math.abs(moveEvent.clientY - initialPos.current.y)
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        isDragging.current = true
        if (listeners?.onPointerDown) {
          listeners.onPointerDown(e)
          // pointer movement exceeded threshold, initiate drag
          onDrag(moveEvent)
        }
        window.removeEventListener('pointermove', handlePointerMove)
      }
    }

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      cleanup()
      if (!isDragging.current && onClick) {
        // pointer-down then pointer-up within the threshold, call click handler
        onClick(upEvent as unknown as React.MouseEvent<HTMLElement>)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const Component = as || 'div'

  return (
    <Component
      role="button"
      tabIndex={0}
      {...attributes}
      className={[baseClass, className, disabled ? `${baseClass}--disabled` : '']
        .filter(Boolean)
        .join(' ')}
      onKeyDown={disabled ? undefined : onKeyDown}
      onPointerDown={disabled ? undefined : handlePointerDown}
      ref={(node) => {
        if (disabled) {
          return
        }
        setNodeRef(node)
        if (ref) {
          ref.current = node
        }
      }}
    >
      {children}
    </Component>
  )
}
