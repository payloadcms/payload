'use client'
import type { SanitizedCollectionConfig, StaticLabel } from 'payload'

import { fieldIsHiddenOrDisabled, fieldIsID } from 'payload/shared'
import React, { useId, useMemo } from 'react'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTableColumns } from '../../providers/TableColumns/index.js'
import { PillSelector, type SelectablePill } from '../PillSelector/index.js'

export type Props = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
}

export const ColumnSelector: React.FC<Props> = ({ collectionSlug }) => {
  const { columns, moveColumn, toggleColumn } = useTableColumns()

  const uuid = useId()
  const editDepth = useEditDepth()

  const filteredColumns = useMemo(
    () =>
      columns?.filter(
        (col) =>
          !(fieldIsHiddenOrDisabled(col.field) && !fieldIsID(col.field)) &&
          !col?.field?.admin?.disableListColumn,
      ),
    [columns],
  )

  const pills: SelectablePill[] = useMemo(() => {
    return filteredColumns
      ? filteredColumns.map((col, i) => {
          const { accessor, active, field } = col

          const label =
            'labelWithPrefix' in field && field.labelWithPrefix !== undefined
              ? field.labelWithPrefix
              : 'label' in field && field.label !== undefined
                ? field.label
                : 'name' in field && field.name !== undefined
                  ? field.name
                  : undefined

          return {
            name: accessor,
            key: `${collectionSlug}-${accessor}-${i}${editDepth ? `-${editDepth}-` : ''}${uuid}`,
            Label: <FieldLabel label={label as StaticLabel} unstyled />,
            selected: active,
          } as SelectablePill
        })
      : null
  }, [collectionSlug, editDepth, filteredColumns, uuid])

  if (!pills) {
    return null
  }

  return (
    <PillSelector
      draggable={{
        onDragEnd: ({ moveFromIndex, moveToIndex }) => {
          void moveColumn({
            fromIndex: moveFromIndex,
            toIndex: moveToIndex,
          })
        },
      }}
      onClick={({ pill }) => {
        void toggleColumn(pill.name)
      }}
      pills={pills}
    />
  )
}
