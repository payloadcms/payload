'use client'
import type { SanitizedCollectionConfig } from 'payload/types'

import React, { useId } from 'react'

import { Plus } from '../../icons/Plus/index.js'
import { X } from '../../icons/X/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { Pill } from '../Pill/index.js'
import { useTableColumns } from '../TableColumns/index.js'
import './index.scss'

const baseClass = 'column-selector'

export type Props = {
  collectionSlug: SanitizedCollectionConfig['slug']
}

export const ColumnSelector: React.FC<Props> = ({ collectionSlug }) => {
  const { columns, moveColumn, toggleColumn } = useTableColumns()

  const uuid = useId()
  const editDepth = useEditDepth()

  if (!columns) {
    return null
  }

  return (
    <DraggableSortable
      className={baseClass}
      ids={columns.map((col) => col?.accessor)}
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        moveColumn({
          fromIndex: moveFromIndex,
          toIndex: moveToIndex,
        })
      }}
    >
      {columns.map((col, i) => {
        if (!col) return null

        const { Label, accessor, active } = col

        if (col.accessor === '_select') return null

        return (
          <Pill
            alignIcon="left"
            aria-checked={active}
            className={[`${baseClass}__column`, active && `${baseClass}__column--active`]
              .filter(Boolean)
              .join(' ')}
            draggable
            icon={active ? <X /> : <Plus />}
            id={accessor}
            key={`${collectionSlug}-${col.name || i}${editDepth ? `-${editDepth}-` : ''}${uuid}`}
            onClick={() => {
              toggleColumn(accessor)
            }}
          >
            {Label}
          </Pill>
        )
      })}
    </DraggableSortable>
  )
}
