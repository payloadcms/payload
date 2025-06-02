'use client'
import type { SanitizedCollectionConfig, StaticLabel } from 'payload'

import { fieldIsHiddenOrDisabled, fieldIsID } from 'payload/shared'
import React, { useId, useMemo } from 'react'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTableColumns } from '../../providers/TableColumns/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { Pill } from '../Pill/index.js'
import './index.scss'

const baseClass = 'column-selector'

export type Props = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
}

export const ColumnSelector: React.FC<Props> = ({ collectionSlug }) => {
  const { columns, moveColumn, toggleColumn } = useTableColumns()

  const uuid = useId()
  const editDepth = useEditDepth()

  const filteredColumns = useMemo(
    () =>
      columns.filter(
        (col) =>
          !(fieldIsHiddenOrDisabled(col.field) && !fieldIsID(col.field)) &&
          !col?.field?.admin?.disableListColumn,
      ),
    [columns],
  )

  if (!columns) {
    return null
  }

  return (
    <DraggableSortable
      className={baseClass}
      ids={filteredColumns.map((col) => col?.accessor)}
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        void moveColumn({
          fromIndex: moveFromIndex,
          toIndex: moveToIndex,
        })
      }}
    >
      {filteredColumns.map((col, i) => {
        const { accessor, active, field } = col

        const label =
          'labelWithPrefix' in field && field.labelWithPrefix !== undefined
            ? field.labelWithPrefix
            : 'label' in field && field.label !== undefined
              ? field.label
              : 'name' in field && field.name !== undefined
                ? field.name
                : undefined

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
            key={`${collectionSlug}-${accessor}-${i}${editDepth ? `-${editDepth}-` : ''}${uuid}`}
            onClick={() => {
              void toggleColumn(accessor)
            }}
            size="small"
          >
            {col.CustomLabel ?? <FieldLabel label={label as StaticLabel} unstyled />}
          </Pill>
        )
      })}
    </DraggableSortable>
  )
}
