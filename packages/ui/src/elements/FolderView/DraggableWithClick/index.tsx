import { useDraggable } from '@dnd-kit/core'
import React, { useRef } from 'react'

import './index.scss'

const baseClass = 'draggable-with-click'

type Props = {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly id: string
  readonly onEvent: (e: React.KeyboardEvent | React.MouseEvent) => void
  readonly ref?: React.RefObject<HTMLDivElement>
  readonly thresholdPixels?: number
}

export const DraggableWithClick = ({
  id,
  children,
  className,
  onEvent,
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
        listeners.onPointerDown(e)
        onEvent(moveEvent)
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
        onEvent(upEvent)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      {...attributes}
      className={`${baseClass} ${className || ''}`.trim()}
      onKeyDown={onEvent}
      onPointerDown={handlePointerDown}
      ref={(node) => {
        setNodeRef(node)
        if (ref) {
          ref.current = node
        }
      }}
    >
      {children}
    </div>
  )
}
