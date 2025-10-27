import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { useMousePosition } from '../../../../hooks/useMousePosition.js'
import './index.scss'

const baseClass = 'row-drop-area'
const DEFAULT_SEGMENT_WIDTH = 30
const THROTTLE_MS = 16

type Placement = 'middle' | 'split-bottom' | 'split-top'

export type RowDropAreaProps = {
  disabled?: boolean
  dropContextName: string
  isDragging?: boolean
  onHover?: (data: { placement: Placement; targetItem: any }) => void
  placement?: Placement
  segmentWidth?: number
  style: React.CSSProperties
  targetItems?: any[]
  xDragOffset?: number
  xSplitOffset?: string
}

export const RowDropArea = ({
  disabled = false,
  dropContextName,
  isDragging = false,
  onHover,
  placement = 'split-bottom',
  segmentWidth = DEFAULT_SEGMENT_WIDTH,
  style,
  targetItems = [],
  xDragOffset = 0,
  xSplitOffset = '0px',
}: RowDropAreaProps) => {
  const id = React.useId()
  const mousePosition = useMousePosition({ enabled: isDragging, throttle: THROTTLE_MS })

  const hoverIndex = React.useMemo(() => {
    if (targetItems.length === 0) {
      return 0
    }
    const relativeX = mousePosition.x - xDragOffset
    const segmentIndex = Math.round(relativeX / segmentWidth)
    return Math.max(Math.min(segmentIndex, targetItems.length - 1), 0)
  }, [mousePosition.x, xDragOffset, segmentWidth, targetItems.length])

  const targetItem = targetItems[hoverIndex]

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: dropContextName, targetItem },
    disabled: disabled || !isDragging,
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
        disabled && `${baseClass}--invalid`,
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
        {(placement === 'split-bottom' || placement === 'split-top') && (
          <div
            className={`${baseClass}__split-marker`}
            style={{
              left:
                targetItem === null ? 0 : `calc(${hoverIndex * segmentWidth}px + ${xSplitOffset})`,
            }}
          />
        )}
      </div>
    </div>
  )
}
