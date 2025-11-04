'use client'

import React from 'react'

import { PlusIcon } from '../../icons/Plus/index.js'
import { XIcon } from '../../icons/X/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { Pill } from '../Pill/index.js'
import './index.scss'

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
  const pillElements = React.useMemo(() => {
    return pills.map((pill, i) => {
      return (
        <Pill
          alignIcon="left"
          aria-checked={pill.selected}
          className={[`${baseClass}__pill`, pill.selected && `${baseClass}__pill--selected`]
            .filter(Boolean)
            .join(' ')}
          draggable={Boolean(draggable)}
          icon={pill.selected ? <XIcon /> : <PlusIcon />}
          id={pill.name}
          key={pill.key ?? `${pill.name}-${i}`}
          onClick={() => {
            if (onClick) {
              void onClick({ pill })
            }
          }}
          size="small"
        >
          {pill.Label ?? <span className={`${baseClass}__pill-label`}>{pill.name}</span>}
        </Pill>
      )
    })
  }, [pills, onClick, draggable])

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
      >
        {pillElements}
      </DraggableSortable>
    )
  }

  return <div className={baseClass}>{pillElements}</div>
}
