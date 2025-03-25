'use client'
import type { ArrayField, ClientField, Row, SanitizedFieldPermissions } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { UseDraggableSortableReturn } from '../../elements/DraggableSortable/useDraggableSortable/types.js'

import { ArrayAction } from '../../elements/ArrayAction/index.js'
import { Collapsible } from '../../elements/Collapsible/index.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { ShimmerEffect } from '../../elements/ShimmerEffect/index.js'
import { useFormSubmitted } from '../../forms/Form/context.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { RowLabel } from '../../forms/RowLabel/index.js'
import { useThrottledValue } from '../../hooks/useThrottledValue.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'array-field'

type ArrayRowProps = {
  readonly addRow: (rowIndex: number) => Promise<void> | void
  readonly CustomRowLabel?: React.ReactNode
  readonly duplicateRow: (rowIndex: number) => void
  readonly errorCount: number
  readonly fields: ClientField[]
  readonly forceRender?: boolean
  readonly hasMaxRows?: boolean
  readonly isLoading?: boolean
  readonly isSortable?: boolean
  readonly labels: Partial<ArrayField['labels']>
  readonly moveRow: (fromIndex: number, toIndex: number) => void
  readonly parentPath: string
  readonly path: string
  readonly permissions: SanitizedFieldPermissions
  readonly readOnly?: boolean
  readonly removeRow: (rowIndex: number) => void
  readonly row: Row
  readonly rowCount: number
  readonly rowIndex: number
  readonly schemaPath: string
  readonly setCollapse: (rowID: string, collapsed: boolean) => void
} & UseDraggableSortableReturn

export const ArrayRow: React.FC<ArrayRowProps> = ({
  addRow,
  attributes,
  CustomRowLabel,
  duplicateRow,
  errorCount,
  fields,
  forceRender = false,
  hasMaxRows,
  isDragging,
  isLoading: isLoadingFromProps,
  isSortable,
  labels,
  listeners,
  moveRow,
  parentPath,
  path,
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
  transition,
}) => {
  const isLoading = useThrottledValue(isLoadingFromProps, 500)

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
        transition,
        zIndex: isDragging ? 1 : undefined,
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
            {isLoading ? (
              <ShimmerEffect height="1rem" width="8rem" />
            ) : (
              <RowLabel
                CustomComponent={CustomRowLabel}
                label={fallbackLabel}
                path={path}
                rowNumber={rowIndex}
              />
            )}
            {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
          </div>
        }
        isCollapsed={row.collapsed}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
      >
        {isLoading ? (
          <ShimmerEffect />
        ) : (
          <RenderFields
            className={`${baseClass}__fields`}
            fields={fields}
            forceRender={forceRender}
            margins="small"
            parentIndexPath=""
            parentPath={path}
            parentSchemaPath={schemaPath}
            permissions={permissions === true ? permissions : permissions?.fields}
            readOnly={readOnly}
          />
        )}
      </Collapsible>
    </div>
  )
}
