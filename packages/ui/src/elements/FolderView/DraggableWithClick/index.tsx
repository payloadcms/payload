import { useDraggable } from '@dnd-kit/core'
import React, { useRef } from 'react'

import './index.scss'

const baseClass = 'draggable-with-click'

type Props = {
  readonly as?: React.ElementType
  readonly children?: React.ReactNode
  readonly className?: string
  readonly id: string
  readonly onClick: (e: React.MouseEvent) => void
  readonly onKeyDown?: (e: React.KeyboardEvent) => void
  readonly ref?: React.RefObject<HTMLDivElement>
  readonly thresholdPixels?: number
}

export const DraggableWithClick = ({
  id,
  as = 'div',
  children,
  className,
  onClick,
  onKeyDown,
  ref,
  thresholdPixels = 3,
}: Props) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id })
  const initialPos = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  const handlePointerDown = (e) => {
    initialPos.current = { x: e.clientX, y: e.clientY }
    isDragging.current = false

    const handlePointerMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - initialPos.current.x)
      const deltaY = Math.abs(moveEvent.clientY - initialPos.current.y)
      if (deltaX > thresholdPixels || deltaY > thresholdPixels) {
        isDragging.current = true
        if (listeners?.onPointerDown) {
          listeners.onPointerDown(e)
          // when the user starts dragging
          // - call the click handler
          // - remove the pointermove listener
          onClick(moveEvent)
        }
        window.removeEventListener('pointermove', handlePointerMove)
      }
    }

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    const handlePointerUp = (upEvent) => {
      cleanup()
      if (!isDragging.current) {
        // if the user did not drag the element
        // - call the click handler
        onClick(upEvent)
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
      className={`${baseClass} ${className || ''}`.trim()}
      onKeyDown={onKeyDown}
      onPointerDown={onClick ? handlePointerDown : undefined}
      ref={(node) => {
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
