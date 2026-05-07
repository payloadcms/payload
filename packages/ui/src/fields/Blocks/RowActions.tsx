'use client'
import type { ClientBlock, ClientField, Labels } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React from 'react'

import { ArrayAction } from '../../elements/ArrayAction/index.js'
import { BlockTemplateDrawer } from '../../elements/BlockTemplateDrawer/index.js'
import { useDrawerSlug } from '../../elements/Drawer/useDrawerSlug.js'
import { SaveTemplatePromptModal } from '../../elements/SaveTemplatePromptModal/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { BlocksDrawer } from './BlocksDrawer/index.js'

export type RowActionsProps = {
  readonly addRow: (rowIndex: number, blockType: string) => Promise<void> | void
  readonly blocks: (ClientBlock | string)[]
  readonly blockType: string
  readonly copyRow: (rowIndex: number) => void
  readonly duplicateRow: (rowIndex: number, blockType: string) => void
  readonly fields: ClientField[]
  readonly hasMaxRows?: boolean
  /** When templates are enabled on the host blocks field, the host collection's slug. */
  readonly hostCollectionSlug?: string
  /** When templates are enabled, the dot-path of the host blocks field (e.g. `'layout'`). */
  readonly hostFieldPath?: string
  readonly isSortable?: boolean
  readonly labels: Labels
  readonly moveRow: (fromIndex: number, toIndex: number) => void
  /** When templates are enabled, called with template data to insert as a new row. */
  readonly onInsertTemplate?: (rowIndex: number, data: Record<string, unknown>) => void
  readonly pasteRow: (rowIndex: number) => void
  readonly removeRow: (rowIndex: number) => void
  /** When templates are enabled, returns the row's current data for saving as a template. */
  readonly resolveRowData?: (rowIndex: number) => Record<string, unknown> | undefined
  readonly rowCount: number
  readonly rowIndex: number
  /** Set when the host `blocks` field has `templates: true`. */
  readonly templatesEnabled?: boolean
}

export const RowActions: React.FC<RowActionsProps> = (props) => {
  const {
    addRow,
    blocks,
    blockType,
    copyRow,
    duplicateRow,
    hasMaxRows,
    hostCollectionSlug,
    hostFieldPath,
    isSortable,
    labels,
    moveRow,
    onInsertTemplate,
    pasteRow,
    removeRow,
    resolveRowData,
    rowCount,
    rowIndex,
    templatesEnabled,
  } = props

  const { t } = useTranslation()
  const { closeModal, openModal } = useModal()
  const drawerSlug = useDrawerSlug('blocks-drawer')
  const templateDrawerSlug = useDrawerSlug('block-template-drawer')
  const saveTemplateModalSlug = useDrawerSlug('save-block-template')

  const [indexToAdd, setIndexToAdd] = React.useState<null | number>(null)
  const [insertIndex, setInsertIndex] = React.useState<null | number>(null)

  const allowedBlockSlugs = React.useMemo(
    () =>
      blocks
        .map((block) => (typeof block === 'string' ? block : block.slug))
        .filter((slug): slug is string => Boolean(slug)),
    [blocks],
  )

  return (
    <React.Fragment>
      <BlocksDrawer
        addRow={(_, rowBlockType) => {
          if (typeof addRow === 'function') {
            void addRow(indexToAdd, rowBlockType)
          }
          closeModal(drawerSlug)
        }}
        addRowIndex={rowIndex}
        blocks={blocks}
        drawerSlug={drawerSlug}
        labels={labels}
      />
      {templatesEnabled && hostCollectionSlug && hostFieldPath ? (
        <BlockTemplateDrawer
          allowedBlockSlugs={allowedBlockSlugs}
          drawerSlug={templateDrawerSlug}
          hostCollectionSlug={hostCollectionSlug}
          hostFieldPath={hostFieldPath}
          onSelect={(data) => {
            if (insertIndex !== null && onInsertTemplate) {
              onInsertTemplate(insertIndex, data)
            }
            setInsertIndex(null)
          }}
        />
      ) : null}
      {templatesEnabled ? (
        <SaveTemplatePromptModal
          heading={t('general:saveBlockAsTemplate')}
          modalSlug={saveTemplateModalSlug}
          resolveSaveArgs={() => {
            const data = resolveRowData?.(rowIndex)
            if (!data) {
              return null
            }
            const dataWithBlockType = { ...data, blockType }
            return {
              data: dataWithBlockType,
              entitySlug: blockType,
              entityType: 'block',
            }
          }}
        />
      ) : null}
      <ArrayAction
        addRow={(index) => {
          setIndexToAdd(index)
          openModal(drawerSlug)
        }}
        copyRow={copyRow}
        duplicateRow={() => duplicateRow(rowIndex, blockType)}
        hasMaxRows={hasMaxRows}
        index={rowIndex}
        isSortable={isSortable}
        moveRow={moveRow}
        onInsertFromTemplate={
          templatesEnabled && hostCollectionSlug && hostFieldPath
            ? (index) => {
                setInsertIndex(index)
                openModal(templateDrawerSlug)
              }
            : undefined
        }
        onSaveAsTemplate={
          templatesEnabled
            ? () => {
                openModal(saveTemplateModalSlug)
              }
            : undefined
        }
        pasteRow={pasteRow}
        removeRow={removeRow}
        rowCount={rowCount}
      />
    </React.Fragment>
  )
}
