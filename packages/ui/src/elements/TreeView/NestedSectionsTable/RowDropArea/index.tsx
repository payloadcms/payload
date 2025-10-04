import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { useMousePosition } from '../../../../hooks/useMousePosition.js'
import './index.scss'

const baseClass = 'row-drop-area'
const DEFAULT_SEGMENT_WIDTH = 30
const THROTTLE_MS = 16

type Placement = 'middle' | 'split'

export type RowDropAreaProps = {
  dragStartX?: number
  dragVariance?: number
  isDragging?: boolean
  markerLeftOffset?: number
  onHover?: (data: { placement: Placement; targetItem: any }) => void
  placement?: Placement
  segmentWidth?: number
  style: React.CSSProperties
  targetItems?: unknown[]
}

export const RowDropArea = ({
  dragStartX = 0,
  dragVariance = 30,
  isDragging = false,
  markerLeftOffset = 0,
  onHover,
  placement = 'split',
  segmentWidth = DEFAULT_SEGMENT_WIDTH,
  style,
  targetItems = [],
}: RowDropAreaProps) => {
  const id = React.useId()
  const mousePosition = useMousePosition({ enabled: isDragging, throttle: THROTTLE_MS })
  const hoverIndex = React.useMemo(() => {
    if (targetItems.length === 0) {
      return 0
    }
    return Math.max(
      Math.min(Math.round((mousePosition.x - dragStartX) / dragVariance), targetItems.length - 1),
      0,
    )
  }, [mousePosition.x, dragStartX, dragVariance, targetItems.length])

  const targetItem = targetItems[hoverIndex]

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: 'row-drop-area', targetItem },
  })

  React.useEffect(() => {
    if (isOver && onHover && targetItem !== undefined) {
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
              left: hoverIndex * segmentWidth + markerLeftOffset,
            }}
          />
        )}
      </div>
    </div>
  )
}
