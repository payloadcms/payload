import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { useMousePosition } from '../../../../hooks/useMousePosition.js'
import './index.scss'

const baseClass = 'row-drop-area'
const DEFAULT_SEGMENT_WIDTH = 30
const THROTTLE_MS = 16

type Placement = 'middle' | 'split'

export type RowDropAreaProps = {
  dropContextName: string
  invalidTargetIDs?: Set<number | string>
  isDragging?: boolean
  onHover?: (data: { placement: Placement; targetItem: any }) => void
  placement?: Placement
  segmentWidth?: number
  style: React.CSSProperties
  targetItems?: unknown[]
  xDragOffset?: number
  xSplitOffset?: string
}

export const RowDropArea = ({
  dropContextName,
  invalidTargetIDs,
  isDragging = false,
  onHover,
  placement = 'split',
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

  // Check if this target is invalid (trying to drop a parent into its own descendant)
  const isInvalidTarget = React.useMemo(() => {
    if (!invalidTargetIDs || !targetItem) {
      return false
    }
    // targetItem can be null (for root level drops) or have a rowID
    const targetID = targetItem?.rowID
    return targetID !== null && targetID !== undefined && invalidTargetIDs.has(targetID)
  }, [invalidTargetIDs, targetItem])

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: dropContextName, targetItem },
    disabled: !isDragging || isInvalidTarget,
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
        isInvalidTarget && `${baseClass}--invalid`,
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
              left: `calc(${hoverIndex * segmentWidth}px + ${xSplitOffset})`,
            }}
          />
        )}
      </div>
    </div>
  )
}
