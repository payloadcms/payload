'use client'
import type { I18nClient } from '@payloadcms/translations'
import type { Labels } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useEffect, useState } from 'react'

import type { ReducedBlock } from '../../../providers/ComponentMap/buildComponentMap/types.js'

import { Drawer } from '../../../elements/Drawer/index.js'
import { ThumbnailCard } from '../../../elements/ThumbnailCard/index.js'
import { DefaultBlockImage } from '../../../graphics/DefaultBlockImage/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { BlockSearch } from './BlockSearch/index.js'
import './index.scss'

export type Props = {
  addRow: (index: number, blockType?: string) => void
  addRowIndex: number
  blocks: ReducedBlock[]
  drawerSlug: string
  labels: Labels
}

const baseClass = 'blocks-drawer'

const getBlockLabel = (block: ReducedBlock, i18n: I18nClient) => {
  if (typeof block.labels.singular === 'string') return block.labels.singular.toLowerCase()
  if (typeof block.labels.singular === 'object') {
    return getTranslation(block.labels.singular, i18n).toLowerCase()
  }
  return ''
}

export const BlocksDrawer: React.FC<Props> = (props) => {
  const { addRow, addRowIndex, blocks, drawerSlug, labels } = props

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredBlocks, setFilteredBlocks] = useState(blocks)
  const { closeModal, isModalOpen } = useModal()
  const { i18n, t } = useTranslation()

  useEffect(() => {
    if (!isModalOpen) {
      setSearchTerm('')
    }
  }, [isModalOpen])

  useEffect(() => {
    const searchTermToUse = searchTerm.toLowerCase()

    const matchingBlocks = blocks?.reduce((matchedBlocks, block) => {
      const blockLabel = getBlockLabel(block, i18n)
      if (blockLabel.includes(searchTermToUse)) matchedBlocks.push(block)
      return matchedBlocks
    }, [])

    setFilteredBlocks(matchingBlocks)
  }, [searchTerm, blocks, i18n])

  return (
    <Drawer
      slug={drawerSlug}
      title={t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })}
    >
      <BlockSearch setSearchTerm={setSearchTerm} />
      <div className={`${baseClass}__blocks-wrapper`}>
        <ul className={`${baseClass}__blocks`}>
          {filteredBlocks?.map((block, index) => {
            const { slug, imageAltText, imageURL, labels: blockLabels } = block

            return (
              <li className={`${baseClass}__block`} key={index}>
                <ThumbnailCard
                  alignLabel="center"
                  label={getTranslation(blockLabels?.singular, i18n)}
                  onClick={() => {
                    addRow(addRowIndex, slug)
                    closeModal(drawerSlug)
                  }}
                  thumbnail={
                    imageURL ? (
                      <img alt={imageAltText} src={imageURL} />
                    ) : (
                      <div className={`${baseClass}__default-image`}>
                        <DefaultBlockImage />
                      </div>
                    )
                  }
                />
              </li>
            )
          })}
        </ul>
      </div>
    </Drawer>
  )
}
