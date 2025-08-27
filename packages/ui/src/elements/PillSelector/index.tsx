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
  const Wrapper = React.useMemo(() => {
    if (draggable) {
      return ({ children }) => (
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
          {children}
        </DraggableSortable>
      )
    } else {
      return ({ children }) => <div className={baseClass}>{children}</div>
    }
  }, [draggable, pills])

  return (
    <Wrapper>
      {pills.map((pill, i) => {
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
      })}
    </Wrapper>
  )
}
