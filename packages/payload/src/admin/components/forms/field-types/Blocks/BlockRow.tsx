import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Block } from '../../../../../fields/config/types'
import type { UseDraggableSortableReturn } from '../../../elements/DraggableSortable/useDraggableSortable/types'
import type { Row } from '../../Form/types'
import type { Props } from './types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import { Collapsible } from '../../../elements/Collapsible'
import { ErrorPill } from '../../../elements/ErrorPill'
import Pill from '../../../elements/Pill'
import { useFormSubmitted } from '../../Form/context'
import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import HiddenInput from '../HiddenInput'
import { RowActions } from './RowActions'
import SectionTitle from './SectionTitle'

const baseClass = 'blocks-field'

type BlockFieldProps = UseDraggableSortableReturn &
  Pick<Props, 'blocks' | 'fieldTypes' | 'indexPath' | 'labels' | 'path' | 'permissions'> & {
    addRow: (rowIndex: number, blockType: string) => void
    blockToRender: Block
    duplicateRow: (rowIndex: number) => void
    forceRender?: boolean
    hasMaxRows?: boolean
    isSortable?: boolean
    moveRow: (fromIndex: number, toIndex: number) => void
    readOnly: boolean
    removeRow: (rowIndex: number) => void
    row: Row
    rowCount: number
    rowIndex: number
    setCollapse: (id: string, collapsed: boolean) => void
  }
export const BlockRow: React.FC<BlockFieldProps> = ({
  addRow,
  attributes,
  blockToRender,
  blocks,
  duplicateRow,
  fieldTypes,
  forceRender,
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
      key={`${parentPath}-row-${rowIndex}`}
      ref={setNodeRef}
      style={{
        transform,
      }}
    >
      <Collapsible
        actions={
          !readOnly ? (
            <RowActions
              addRow={addRow}
              blockType={row.blockType}
              blocks={blocks}
              duplicateRow={duplicateRow}
              hasMaxRows={hasMaxRows}
              isSortable={isSortable}
              labels={labels}
              moveRow={moveRow}
              removeRow={removeRow}
              rowCount={rowCount}
              rowIndex={rowIndex}
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
          <div className={`${baseClass}__block-header`}>
            <span className={`${baseClass}__block-number`}>
              {String(rowIndex + 1).padStart(2, '0')}
            </span>
            <Pill
              className={`${baseClass}__block-pill ${baseClass}__block-pill-${row.blockType}`}
              pillStyle="white"
            >
              {getTranslation(blockToRender.labels.singular, i18n)}
            </Pill>
            <SectionTitle path={`${path}.blockName`} readOnly={readOnly} />
            {fieldHasErrors && <ErrorPill count={childErrorPathsCount} withMessage />}
          </div>
        }
        key={row.id}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
      >
        <HiddenInput name={`${path}.id`} value={row.id} />
        <RenderFields
          className={`${baseClass}__fields`}
          fieldSchema={blockToRender.fields.map((field) => ({
            ...field,
            path: createNestedFieldPath(path, field),
          }))}
          fieldTypes={fieldTypes}
          forceRender={forceRender}
          indexPath={indexPath}
          margins="small"
          permissions={permissions?.blocks?.[row.blockType]?.fields}
          readOnly={readOnly}
        />
      </Collapsible>
    </div>
  )
}
