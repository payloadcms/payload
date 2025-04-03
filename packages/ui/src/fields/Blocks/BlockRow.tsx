'use client'
import type { ClientBlock, ClientField, Labels, Row, SanitizedFieldPermissions } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { UseDraggableSortableReturn } from '../../elements/DraggableSortable/useDraggableSortable/types.js'
import type { RenderFieldsProps } from '../../forms/RenderFields/types.js'

import { Collapsible } from '../../elements/Collapsible/index.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { Pill } from '../../elements/Pill/index.js'
import { ShimmerEffect } from '../../elements/ShimmerEffect/index.js'
import { useFormSubmitted } from '../../forms/Form/context.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { RowLabel } from '../../forms/RowLabel/index.js'
import { useThrottledValue } from '../../hooks/useThrottledValue.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { RowActions } from './RowActions.js'
import { SectionTitle } from './SectionTitle/index.js'

const baseClass = 'blocks-field'

type BlocksFieldProps = {
  addRow: (rowIndex: number, blockType: string) => Promise<void> | void
  block: ClientBlock
  blocks: (ClientBlock | string)[] | ClientBlock[]
  duplicateRow: (rowIndex: number) => void
  errorCount: number
  fields: ClientField[]
  hasMaxRows?: boolean
  isLoading?: boolean
  isSortable?: boolean
  Label?: React.ReactNode
  labels: Labels
  moveRow: (fromIndex: number, toIndex: number) => void
  parentPath: string
  path: string
  permissions: SanitizedFieldPermissions
  readOnly: boolean
  removeRow: (rowIndex: number) => void
  row: Row
  rowCount: number
  rowIndex: number
  schemaPath: string
  setCollapse: (id: string, collapsed: boolean) => void
} & UseDraggableSortableReturn

export const BlockRow: React.FC<BlocksFieldProps> = ({
  addRow,
  attributes,
  block,
  blocks,
  duplicateRow,
  errorCount,
  fields,
  hasMaxRows,
  isLoading: isLoadingFromProps,
  isSortable,
  Label,
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
}) => {
  const isLoading = useThrottledValue(isLoadingFromProps, 500)

  const { i18n } = useTranslation()
  const hasSubmitted = useFormSubmitted()

  const fieldHasErrors = hasSubmitted && errorCount > 0

  const showBlockName = !block.admin?.disableBlockName

  const classNames = [
    `${baseClass}__row`,
    fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`,
  ]
    .filter(Boolean)
    .join(' ')

  let blockPermissions: RenderFieldsProps['permissions'] = undefined

  if (permissions === true) {
    blockPermissions = true
  } else {
    const permissionsBlockSpecific = permissions?.blocks?.[block.slug]
    if (permissionsBlockSpecific === true) {
      blockPermissions = true
    } else {
      blockPermissions = permissionsBlockSpecific?.fields
    }
  }

  return (
    <div
      id={`${parentPath?.split('.').join('-')}-row-${rowIndex}`}
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
              blocks={blocks}
              blockType={row.blockType}
              duplicateRow={duplicateRow}
              fields={block.fields}
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
          isLoading ? (
            <ShimmerEffect height="1rem" width="8rem" />
          ) : (
            <div className={`${baseClass}__block-header`}>
              <RowLabel
                CustomComponent={Label}
                label={
                  <>
                    <span className={`${baseClass}__block-number`}>
                      {String(rowIndex + 1).padStart(2, '0')}
                    </span>
                    <Pill
                      className={`${baseClass}__block-pill ${baseClass}__block-pill-${row.blockType}`}
                      pillStyle="white"
                    >
                      {getTranslation(block.labels.singular, i18n)}
                    </Pill>
                    {showBlockName && (
                      <SectionTitle path={`${path}.blockName`} readOnly={readOnly} />
                    )}
                  </>
                }
                path={path}
                rowNumber={rowIndex}
              />
              {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} withMessage />}
            </div>
          )
        }
        isCollapsed={row.collapsed}
        key={row.id}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
      >
        {isLoading ? (
          <ShimmerEffect />
        ) : (
          <RenderFields
            className={`${baseClass}__fields`}
            fields={fields}
            margins="small"
            parentIndexPath=""
            parentPath={path}
            parentSchemaPath={schemaPath}
            permissions={blockPermissions}
            readOnly={readOnly}
          />
        )}
      </Collapsible>
    </div>
  )
}
