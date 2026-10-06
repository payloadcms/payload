'use client'
import type { ClientBlock, Labels } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useEffect, useState } from 'react'

import { Drawer } from '../../../elements/Drawer/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { BlockSelector } from '../BlockSelector/index.js'

export type Props = {
  readonly addRow: (index: number, blockType?: string) => Promise<void> | void
  readonly addRowIndex: number
  readonly blocks: (ClientBlock | string)[]
  readonly drawerSlug: string
  readonly labels: Labels
}

export const BlocksDrawer: React.FC<Props> = (props) => {
  const { addRow, addRowIndex, blocks, drawerSlug, labels } = props

  const { closeModal, isModalOpen } = useModal()
  const { i18n, t } = useTranslation()
  const [searchTermOverride, setSearchTermOverride] = useState('')
  const [selectedBlock, setSelectedBlock] = useState<null | string>(null)

  useEffect(() => {
    if (!isModalOpen(drawerSlug)) {
      setSearchTermOverride('')
      setSelectedBlock(null)
    }
  }, [isModalOpen, drawerSlug])

  const handleInsert = useCallback(() => {
    if (selectedBlock) {
      void addRow(addRowIndex, selectedBlock)
      closeModal(drawerSlug)
    }
  }, [selectedBlock, addRow, addRowIndex, closeModal, drawerSlug])

  const handleDoubleClick = useCallback(
    (slug: string) => {
      void addRow(addRowIndex, slug)
      closeModal(drawerSlug)
    },
    [addRow, addRowIndex, closeModal, drawerSlug],
  )

  return (
    <Drawer
      headerActions={[
        {
          disabled: !selectedBlock,
          label: 'Insert',
          onClick: handleInsert,
          style: 'primary',
        },
      ]}
      slug={drawerSlug}
      title={t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })}
    >
      <BlockSelector
        blocks={blocks}
        onDoubleClick={handleDoubleClick}
        onSelect={setSelectedBlock}
        searchTerm={searchTermOverride}
        selectedBlock={selectedBlock}
      />
    </Drawer>
  )
}
