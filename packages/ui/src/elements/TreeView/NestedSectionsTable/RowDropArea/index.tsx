import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import './index.scss'

const baseClass = 'row-drop-area'
const SEGMENT_WIDTH = 30

export const RowDropArea = ({
  dragStartX = 0,
  dragVariance = 100,
  isDragging = false,
  markerLeftOffset = 0,
  onHover,
  placement = 'split',
  style,
  targetItems = [],
}: {
  dragStartX?: number
  dragVariance?: number
  isDragging?: boolean
  markerLeftOffset?: number
  onHover?: (data: { placement: 'middle' | 'split'; targetItem: any }) => void
  placement?: 'middle' | 'split'
  style: React.CSSProperties
  targetItems?: any[]
}) => {
  const [currentMouseX, setCurrentMouseX] = React.useState(0)

  const hoverIndex = Math.max(
    Math.min(Math.round((currentMouseX - dragStartX) / dragVariance), targetItems.length - 1),
    0,
  )
  const targetItem = targetItems[hoverIndex]

  const id = React.useId()
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: 'row-drop-area', targetItem },
  })

  React.useEffect(() => {
    if (!isDragging) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      setCurrentMouseX(e.clientX)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isDragging])

  React.useEffect(() => {
    if (isOver && onHover) {
      onHover({ placement, targetItem })
    }
  }, [isOver, targetItem, onHover, placement])

  return (
    <div
      className={[
        baseClass,
        `${baseClass}--on-${placement}`,
        isDragging && 'is-dragging',
        isOver && 'is-over',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      title={`Parent: ${hoverIndex} ${id}`}
    >
      <div
        ref={setNodeRef}
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        {placement === 'split' && (
          <div
            className={`${baseClass}__split-marker`}
            style={{
              left: hoverIndex * SEGMENT_WIDTH + markerLeftOffset,
            }}
          />
        )}
      </div>
    </div>
  )
}
