'use client'
import type { ArrayField, FieldPermissions, Row } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { UseDraggableSortableReturn } from '../../elements/DraggableSortable/useDraggableSortable/types.js'
import type { FieldMap } from '../../providers/ComponentMap/buildComponentMap/types.js'

import { ArrayAction } from '../../elements/ArrayAction/index.js'
import { Collapsible } from '../../elements/Collapsible/index.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { useFormSubmitted } from '../../forms/Form/context.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { RowLabel } from '../../forms/RowLabel/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'array-field'

type ArrayRowProps = {
  CustomRowLabel?: React.ReactNode
  addRow: (rowIndex: number) => void
  duplicateRow: (rowIndex: number) => void
  errorCount: number
  fieldMap: FieldMap
  forceRender?: boolean
  hasMaxRows?: boolean
  indexPath: string
  isSortable?: boolean
  labels: ArrayField['labels']
  moveRow: (fromIndex: number, toIndex: number) => void
  path: string
  permissions: FieldPermissions
  readOnly?: boolean
  removeRow: (rowIndex: number) => void
  row: Row
  rowCount: number
  rowIndex: number
  schemaPath: string
  setCollapse: (rowID: string, collapsed: boolean) => void
} & UseDraggableSortableReturn

export const ArrayRow: React.FC<ArrayRowProps> = ({
  CustomRowLabel,
  addRow,
  attributes,
  duplicateRow,
  errorCount,
  fieldMap,
  forceRender = false,
  hasMaxRows,
  indexPath,
  isSortable,
  labels,
  listeners,
  moveRow,
  path: parentPath,
  permissions,
  readOnly,
  removeRow,
  row,
  rowCount,
  rowIndex,
  schemaPath,
  setCollapse,
  setNodeRef,
  transform,
}) => {
  const path = `${parentPath}.${rowIndex}`
  const { i18n } = useTranslation()
  const hasSubmitted = useFormSubmitted()

  const fallbackLabel = `${getTranslation(labels.singular, i18n)} ${String(rowIndex + 1).padStart(
    2,
    '0',
  )}`

  const fieldHasErrors = errorCount > 0 && hasSubmitted

  const classNames = [
    `${baseClass}__row`,
    fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      id={`${parentPath.split('.').join('-')}-row-${rowIndex}`}
      key={`${parentPath}-row-${row.id}`}
      ref={setNodeRef}
      style={{
        transform,
      }}
    >
      <Collapsible
        actions={
          !readOnly ? (
            <ArrayAction
              addRow={addRow}
              duplicateRow={duplicateRow}
              hasMaxRows={hasMaxRows}
              index={rowIndex}
              isSortable={isSortable}
              moveRow={moveRow}
              removeRow={removeRow}
              rowCount={rowCount}
            />
          ) : undefined
        }
        className={classNames}
        collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
        dragHandleProps={
          isSortable
            ? {
                id: row.id,
                attributes,
                listeners,
              }
            : undefined
        }
        header={
          <div className={`${baseClass}__row-header`}>
            <RowLabel
              RowLabelComponent={CustomRowLabel}
              i18n={i18n}
              path={path}
              rowLabel={fallbackLabel}
              rowNumber={rowIndex + 1}
            />
            {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
          </div>
        }
        isCollapsed={row.collapsed}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
      >
        <RenderFields
          className={`${baseClass}__fields`}
          fieldMap={fieldMap}
          forceRender={forceRender}
          indexPath={indexPath}
          margins="small"
          path={path}
          permissions={permissions?.fields}
          readOnly={readOnly}
          schemaPath={schemaPath}
        />
      </Collapsible>
    </div>
  )
}
