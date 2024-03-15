'use client'
import type { FieldPermissions } from 'payload/auth'
import type { Labels, Row } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { UseDraggableSortableReturn } from '../../../elements/DraggableSortable/useDraggableSortable/types.js'
import type { ReducedBlock } from '../../../utilities/buildComponentMap/types.js'

import { Collapsible } from '../../../elements/Collapsible/index.js'
import { ErrorPill } from '../../../elements/ErrorPill/index.js'
import Pill from '../../../elements/Pill/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { FieldPropsProvider } from '../../FieldPropsProvider/index.js'
import { useFormSubmitted } from '../../Form/context.js'
import { RenderFields } from '../../RenderFields/index.js'
import { WatchChildErrors } from '../../WatchChildErrors/index.js'
import HiddenInput from '../HiddenInput/index.js'
import { RowActions } from './RowActions.js'
import SectionTitle from './SectionTitle/index.js'

const baseClass = 'blocks-field'

type BlockFieldProps = UseDraggableSortableReturn & {
  addRow: (rowIndex: number, blockType: string) => void
  block: ReducedBlock
  blocks: ReducedBlock[]
  duplicateRow: (rowIndex: number) => void
  forceRender?: boolean
  hasMaxRows?: boolean
  indexPath: string
  labels: Labels
  moveRow: (fromIndex: number, toIndex: number) => void
  path: string
  permissions: FieldPermissions
  readOnly: boolean
  removeRow: (rowIndex: number) => void
  row: Row
  rowCount: number
  rowIndex: number
  schemaPath: string
  setCollapse: (id: string, collapsed: boolean) => void
}

export const BlockRow: React.FC<BlockFieldProps> = ({
  addRow,
  attributes,
  block,
  blocks,
  duplicateRow,
  forceRender,
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
  schemaPath,
  setCollapse,
  setNodeRef,
  transform,
}) => {
  const path = `${parentPath}.${rowIndex}`
  const { i18n } = useTranslation()
  const hasSubmitted = useFormSubmitted()
  const [errorCount, setErrorCount] = React.useState(0)

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
      <WatchChildErrors fieldMap={block.subfields} path={path} setErrorCount={setErrorCount} />
      <Collapsible
        actions={
          !readOnly ? (
            <RowActions
              addRow={addRow}
              blockType={row.blockType}
              blocks={blocks}
              duplicateRow={duplicateRow}
              fieldMap={block.subfields}
              hasMaxRows={hasMaxRows}
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
        dragHandleProps={{
          id: row.id,
          attributes,
          listeners,
        }}
        header={(
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
            {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
          </div>
        )}
        key={row.id}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
      >
        <HiddenInput name={`${path}.id`} value={row.id} />
        <RenderFields
          className={`${baseClass}__fields`}
          fieldMap={block.subfields}
          forceRender={forceRender}
          margins="small"
          path={path}
          permissions={permissions?.blocks?.[block.slug]?.fields}
          readOnly={readOnly}
          schemaPath={`${schemaPath}.${block.slug}`}
        />
      </Collapsible>
    </div>
  )
}
