import { useDraggable } from '@dnd-kit/core'
import React, { useId, useRef } from 'react'

import './index.scss'

const baseClass = 'draggable-with-click'

type Props = {
  readonly as?: React.ElementType
  readonly children?: React.ReactNode
  readonly className?: string
  readonly disabled?: boolean
  readonly onClick: (event: React.MouseEvent<HTMLElement>) => void
  readonly onDrag: (e: PointerEvent) => void
  readonly onKeyDown?: (e: React.KeyboardEvent) => void
  readonly ref?: React.RefObject<HTMLDivElement>
  readonly thresholdPixels?: number
}

export const DraggableWithClick = ({
  as = 'div',
  children,
  className,
  disabled = false,
  onClick,
  onDrag,
  onKeyDown,
  ref,
  thresholdPixels = 3,
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
      if (deltaX > thresholdPixels || deltaY > thresholdPixels) {
        isDragging.current = true
        if (listeners?.onPointerDown) {
          listeners.onPointerDown(e)
          // when the user starts dragging
          // - call the click handler
          // - remove the pointermove listener
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
      if (!isDragging.current) {
        // if the user did not drag the element
        // - call the click handler
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
