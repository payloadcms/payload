import React from 'react'
import { useTranslation } from 'react-i18next'

import type { UseDraggableSortableReturn } from '../../../elements/DraggableSortable/useDraggableSortable/types'
import type { Row } from '../../Form/types'
import type { RowLabel as RowLabelType } from '../../RowLabel/types'
import type { Props } from './types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import { ArrayAction } from '../../../elements/ArrayAction'
import { Collapsible } from '../../../elements/Collapsible'
import { ErrorPill } from '../../../elements/ErrorPill'
import { useFormSubmitted } from '../../Form/context'
import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import { RowLabel } from '../../RowLabel'
import HiddenInput from '../HiddenInput'
import './index.scss'

const baseClass = 'array-field'

type ArrayRowProps = UseDraggableSortableReturn &
  Pick<Props, 'fieldTypes' | 'fields' | 'indexPath' | 'labels' | 'path' | 'permissions'> & {
    CustomRowLabel?: RowLabelType
    addRow: (rowIndex: number) => void
    duplicateRow: (rowIndex: number) => void
    forceRender?: boolean
    hasMaxRows?: boolean
    isSortable: boolean
    moveRow: (fromIndex: number, toIndex: number) => void
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
  fieldTypes,
  fields,
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

  const childErrorPathsCount = row.childErrorPaths?.size
  const fieldHasErrors = hasSubmitted && childErrorPathsCount > 0

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
        collapsed={row.collapsed}
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
              label={CustomRowLabel || fallbackLabel}
              path={path}
              rowNumber={rowIndex + 1}
            />
            {fieldHasErrors && <ErrorPill count={childErrorPathsCount} withMessage />}
          </div>
        }
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
      >
        <HiddenInput name={`${path}.id`} value={row.id} />
        <RenderFields
          className={`${baseClass}__fields`}
          fieldSchema={fields.map((field) => ({
            ...field,
            path: createNestedFieldPath(path, field),
          }))}
          fieldTypes={fieldTypes}
          forceRender={forceRender}
          indexPath={indexPath}
          margins="small"
          permissions={permissions?.fields}
          readOnly={readOnly}
        />
      </Collapsible>
    </div>
  )
}
