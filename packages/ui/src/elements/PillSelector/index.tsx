'use client'

import { horizontalListSortingStrategy } from '@dnd-kit/sortable'
import React from 'react'

import { PlusIcon } from '../../icons/Plus/index.js'
import { XIcon } from '../../icons/X/index.js'
import { Chip } from '../Chip/index.js'
import { DraggableSortableItem } from '../DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import './index.css'

const baseClass = 'pill-selector'

export type SelectablePill = {
  key?: string
  Label?: React.ReactNode
  name: string
  selected: boolean
}

export type Props = {
  draggable?: {
    onDragEnd: (args: { moveFromIndex: number; moveToIndex: number }) => void
  }
  onClick?: (args: { pill: SelectablePill }) => Promise<void> | void
  pills: SelectablePill[]
}

/**
 * Displays a wrappable list of pills that can be selected or deselected.
 * If `draggable` is true, the pills can be reordered by dragging.
 */
export const PillSelector: React.FC<Props> = ({ draggable, onClick, pills }) => {
  // IMPORTANT: Do NOT wrap DraggableSortable in a dynamic component function using useMemo.
  // BAD: useMemo(() => ({ children }) => <DraggableSortable>...</DraggableSortable>, [deps])
  // This creates a new function reference on each recomputation, causing React to treat it as a
  // different component type, triggering unmount/mount cycles instead of just updating props.
  // GOOD: Use conditional rendering directly: draggable ? <DraggableSortable /> : <div />

  if (draggable) {
    return (
      <DraggableSortable
        className={baseClass}
        ids={pills.map((pill) => pill.name)}
        onDragEnd={({ moveFromIndex, moveToIndex }) => {
          draggable.onDragEnd({
            moveFromIndex,
            moveToIndex,
          })
        }}
        sortingStrategy={horizontalListSortingStrategy}
      >
        {pills.map((pill, i) => (
          <DraggableSortableItem id={pill.name} key={pill.key ?? `${pill.name}-${i}`}>
            {({ attributes, isDragging, listeners, setNodeRef, transform }) => {
              // Exclude tabIndex from attributes - the action button inside handles focus
              const { tabIndex: _tabIndex, ...restAttributes } = attributes
              return (
                <Chip
                  aria-label={pill.name}
                  className={[
                    `${baseClass}__draggable-item`,
                    isDragging && `${baseClass}__draggable-item--is-dragging`,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  elementProps={{
                    ...listeners,
                    ...restAttributes,
                    ref: setNodeRef,
                    style: {
                      ...restAttributes.style,
                      transform,
                    },
                  }}
                  icon={pill.selected ? <XIcon /> : <PlusIcon />}
                  id={pill.name}
                  onClick={() => {
                    if (onClick) {
                      void onClick({ pill })
                    }
                  }}
                  selected={pill.selected}
                >
                  {pill.Label ?? <span className={`${baseClass}__pill-label`}>{pill.name}</span>}
                </Chip>
              )
            }}
          </DraggableSortableItem>
        ))}
      </DraggableSortable>
    )
  }

  return (
    <div className={baseClass}>
      {pills.map((pill, i) => (
        <Chip
          aria-label={pill.name}
          icon={pill.selected ? <XIcon /> : <PlusIcon />}
          id={pill.name}
          key={pill.key ?? `${pill.name}-${i}`}
          onClick={() => {
            if (onClick) {
              void onClick({ pill })
            }
          }}
          selected={pill.selected}
        >
          {pill.Label ?? <span className={`${baseClass}__pill-label`}>{pill.name}</span>}
        </Chip>
      ))}
    </div>
  )
}
