import type { FieldPermissions } from 'payload/auth'
import type { ArrayField, Row, RowLabel as RowLabelType } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React, { useState } from 'react'

import type { UseDraggableSortableReturn } from '../../../elements/DraggableSortable/useDraggableSortable/types.js'
import type { FieldMap } from '../../../utilities/buildComponentMap/types.js'

import { ArrayAction } from '../../../elements/ArrayAction/index.js'
import { Collapsible } from '../../../elements/Collapsible/index.js'
import { ErrorPill } from '../../../elements/ErrorPill/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { useFormSubmitted } from '../../Form/context.js'
import { RenderFields } from '../../RenderFields/index.js'
import { RowLabel } from '../../RowLabel/index.js'
import { WatchChildErrors } from '../../WatchChildErrors/index.js'
import HiddenInput from '../HiddenInput/index.js'
import './index.scss'

const baseClass = 'array-field'

type ArrayRowProps = UseDraggableSortableReturn & {
  CustomRowLabel?: React.ReactNode
  addRow: (rowIndex: number) => void
  duplicateRow: (rowIndex: number) => void
  fieldMap: FieldMap
  forceRender?: boolean
  hasMaxRows?: boolean
  indexPath: string
  labels: ArrayField['labels']
  moveRow: (fromIndex: number, toIndex: number) => void
  path: string
  permissions: FieldPermissions
  readOnly?: boolean
  removeRow: (rowIndex: number) => void
  row: Row
  rowCount: number
  rowIndex: number
  setCollapse: (rowID: string, collapsed: boolean) => void
}

export const ArrayRow: React.FC<ArrayRowProps> = ({
  CustomRowLabel,
  addRow,
  attributes,
  duplicateRow,
  fieldMap,
  forceRender = false,
  hasMaxRows,
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
}) => {
  const path = `${parentPath}.${rowIndex}`
  const { i18n } = useTranslation()
  const hasSubmitted = useFormSubmitted()
  const [errorCount, setErrorCount] = useState(0)

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
  console.log(fieldMap)
  return (
    <div
      id={`${parentPath.split('.').join('-')}-row-${rowIndex}`}
      key={`${parentPath}-row-${row.id}`}
      ref={setNodeRef}
      style={{
        transform,
      }}
    >
      <WatchChildErrors fieldMap={fieldMap} path={path} setErrorCount={setErrorCount} />
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
        header={(
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
        )}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
      >
        <HiddenInput name={`${path}.id`} value={row.id} />
        <RenderFields
          className={`${baseClass}__fields`}
          fieldMap={fieldMap}
          forceRender={forceRender}
          margins="small"
          path={path}
          permissions={permissions?.fields}
          readOnly={readOnly}
          schemaPath={parentPath}
        />
      </Collapsible>
    </div>
  )
}
