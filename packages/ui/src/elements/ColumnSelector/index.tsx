'use client'
import type { SanitizedCollectionConfig } from 'payload'

import React, { useId } from 'react'

import type { Column } from '../Table/index.js'

import { PlusIcon } from '../../icons/Plus/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { Pill } from '../Pill/index.js'
import { useTableColumns } from '../TableColumns/index.js'
import './index.scss'

const baseClass = 'column-selector'

export type Props = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
}

const filterColumnFields = (fields: Column[]): Column[] => {
  return fields.filter((field) => {
    return !field.cellProps?.field?.admin?.disableListColumn
  })
}

export const ColumnSelector: React.FC<Props> = ({ collectionSlug }) => {
  const { columns, moveColumn, toggleColumn } = useTableColumns()

  const uuid = useId()
  const editDepth = useEditDepth()

  if (!columns) {
    return null
  }

  const filteredColumns = filterColumnFields(columns)

  return (
    <DraggableSortable
      className={baseClass}
      ids={filteredColumns.map((col) => col?.accessor)}
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        moveColumn({
          fromIndex: moveFromIndex,
          toIndex: moveToIndex,
        })
      }}
    >
      {filteredColumns.map((col, i) => {
        if (!col) {
          return null
        }

        const {
          accessor,
          active,
          // cellProps: {
          // field: {
          // admin: {
          //   // @ts-expect-error // TODO: `Label` does not exist on the UI field
          //   components: { Label } = {},
          // } = {},
          // } = {},
          // },
        } = col

        if (col.accessor === '_select') {
          return null
        }

        return (
          <Pill
            alignIcon="left"
            aria-checked={active}
            className={[`${baseClass}__column`, active && `${baseClass}__column--active`]
              .filter(Boolean)
              .join(' ')}
            draggable
            icon={active ? <XIcon /> : <PlusIcon />}
            id={accessor}
            key={`${collectionSlug}-${col.cellProps?.field && 'name' in col.cellProps.field ? col.cellProps?.field?.name : i}${editDepth ? `-${editDepth}-` : ''}${uuid}`}
            onClick={() => {
              toggleColumn(accessor)
            }}
          >
            TODO: Label
          </Pill>
        )
      })}
    </DraggableSortable>
  )
}
