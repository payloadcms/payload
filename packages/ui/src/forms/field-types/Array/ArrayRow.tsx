import React from 'react'
import { useTranslation } from '../../../providers/Translation'

import type { UseDraggableSortableReturn } from '../../../elements/DraggableSortable/useDraggableSortable/types'
import type { Row } from '../../Form/types'
import type { ArrayField, RowLabel as RowLabelType } from 'payload/types'

import { ArrayAction } from '../../../elements/ArrayAction'
import { Collapsible } from '../../../elements/Collapsible'
import { ErrorPill } from '../../../elements/ErrorPill'
import { useFormSubmitted } from '../../Form/context'
import RenderFields from '../../RenderFields'
import HiddenInput from '../HiddenInput'
import { FieldPathProvider } from '../../FieldPathProvider'
import { buildFieldMap } from '../../RenderFields/buildFieldMap'
import { FieldPermissions } from 'payload/auth'

import './index.scss'
import { getTranslation } from '@payloadcms/translations'

const baseClass = 'array-field'

type ArrayRowProps = UseDraggableSortableReturn & {
  CustomRowLabel?: RowLabelType
  addRow: (rowIndex: number) => void
  duplicateRow: (rowIndex: number) => void
  forceRender?: boolean
  hasMaxRows?: boolean
  labels: ArrayField['labels']
  moveRow: (fromIndex: number, toIndex: number) => void
  readOnly?: boolean
  removeRow: (rowIndex: number) => void
  row: Row
  rowCount: number
  rowIndex: number
  setCollapse: (rowID: string, collapsed: boolean) => void
  indexPath: string
  path: string
  permissions: FieldPermissions
  fieldMap: ReturnType<typeof buildFieldMap>
}

export const ArrayRow: React.FC<ArrayRowProps> = ({
  CustomRowLabel,
  addRow,
  attributes,
  duplicateRow,
  forceRender = false,
  hasMaxRows,
  indexPath,
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
  setCollapse,
  setNodeRef,
  transform,
  fieldMap,
}) => {
  const path = `${parentPath}.${rowIndex}`
  const { i18n } = useTranslation()
  const hasSubmitted = useFormSubmitted()

  const fallbackLabel = `${getTranslation(labels.singular, i18n)} ${String(rowIndex + 1).padStart(
    2,
    '0',
  )}`

  const errorCount = row.errorPaths?.size
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
              moveRow={moveRow}
              removeRow={removeRow}
              rowCount={rowCount}
            />
          ) : undefined
        }
        className={classNames}
        collapsed={row.collapsed}
        collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
        dragHandleProps={{
          id: row.id,
          attributes,
          listeners,
        }}
        header={
          <div className={`${baseClass}__row-header`}>
            {/* <RowLabel
              label={CustomRowLabel || fallbackLabel}
              path={path}
              rowNumber={rowIndex + 1}
            /> */}
            {fieldHasErrors && <ErrorPill count={errorCount} withMessage i18n={i18n} />}
          </div>
        }
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
      >
        <HiddenInput name={`${path}.id`} value={row.id} />
        <FieldPathProvider path={path}>
          <RenderFields
            className={`${baseClass}__fields`}
            fieldMap={fieldMap}
            forceRender={forceRender}
            indexPath={indexPath}
            margins="small"
            permissions={permissions?.fields}
            readOnly={readOnly}
          />
        </FieldPathProvider>
      </Collapsible>
    </div>
  )
}
