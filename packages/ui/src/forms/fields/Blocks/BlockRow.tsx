'use client'
import React from 'react'
import { useTranslation } from '../../../providers/Translation'

import type { UseDraggableSortableReturn } from '../../../elements/DraggableSortable/useDraggableSortable/types'
import type { Row } from '../../Form/types'

import { getTranslation } from '@payloadcms/translations'
import { Collapsible } from '../../../elements/Collapsible'
import { ErrorPill } from '../../../elements/ErrorPill'
import Pill from '../../../elements/Pill'
import { useFormSubmitted } from '../../Form/context'
import RenderFields from '../../RenderFields'
import HiddenInput from '../HiddenInput'
import { RowActions } from './RowActions'
import SectionTitle from './SectionTitle'
import { FieldPathProvider } from '../../FieldPathProvider'
import { Labels } from 'payload/types'
import { FieldPermissions } from 'payload/auth'
import { ReducedBlock } from '../../../utilities/buildComponentMap/types'

const baseClass = 'blocks-field'

type BlockFieldProps = UseDraggableSortableReturn & {
  addRow: (rowIndex: number, blockType: string) => void
  blocks: ReducedBlock[]
  block: ReducedBlock
  duplicateRow: (rowIndex: number) => void
  forceRender?: boolean
  hasMaxRows?: boolean
  moveRow: (fromIndex: number, toIndex: number) => void
  readOnly: boolean
  removeRow: (rowIndex: number) => void
  row: Row
  rowCount: number
  rowIndex: number
  setCollapse: (id: string, collapsed: boolean) => void
  indexPath: string
  path: string
  labels: Labels
  permissions: FieldPermissions
}

export const BlockRow: React.FC<BlockFieldProps> = ({
  addRow,
  attributes,
  blocks,
  block,
  duplicateRow,
  forceRender,
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
}) => {
  const path = `${parentPath}.${rowIndex}`
  const { i18n } = useTranslation()
  const hasSubmitted = useFormSubmitted()

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
              duplicateRow={duplicateRow}
              hasMaxRows={hasMaxRows}
              labels={labels}
              moveRow={moveRow}
              removeRow={removeRow}
              rowCount={rowCount}
              rowIndex={rowIndex}
              blocks={blocks}
              fieldMap={block.subfields}
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
          <div className={`${baseClass}__block-header`}>
            <span className={`${baseClass}__block-number`}>
              {String(rowIndex + 1).padStart(2, '0')}
            </span>
            <Pill
              className={`${baseClass}__block-pill ${baseClass}__block-pill-${row.blockType}`}
              pillStyle="white"
            >
              {getTranslation(block.labels.singular, i18n)}
            </Pill>
            <SectionTitle path={`${path}.blockName`} readOnly={readOnly} />
            {fieldHasErrors && <ErrorPill count={errorCount} withMessage i18n={i18n} />}
          </div>
        }
        key={row.id}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
      >
        <HiddenInput name={`${path}.id`} value={row.id} />
        <FieldPathProvider path={path}>
          <RenderFields
            className={`${baseClass}__fields`}
            fieldMap={block.subfields}
            forceRender={forceRender}
            indexPath={indexPath}
            margins="small"
            permissions={permissions?.blocks?.[row.blockType]?.fields}
            readOnly={readOnly}
          />
        </FieldPathProvider>
      </Collapsible>
    </div>
  )
}
