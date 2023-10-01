import type { i18n } from 'i18next'

import { useModal } from '@faceless-ui/modal'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Block } from '../../../../../../fields/config/types'
import type { Props } from './types'

import { getTranslation } from '../../../../../../utilities/getTranslation'
import { Drawer } from '../../../../elements/Drawer'
import { ThumbnailCard } from '../../../../elements/ThumbnailCard'
import DefaultBlockImage from '../../../../graphics/DefaultBlockImage'
import BlockSearch from './BlockSearch'
import './index.scss'

const baseClass = 'blocks-drawer'

const getBlockLabel = (block: Block, i18n: i18n) => {
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
  const { i18n, t } = useTranslation('fields')

  useEffect(() => {
    if (!isModalOpen) {
      setSearchTerm('')
    }
  }, [isModalOpen])

  useEffect(() => {
    const searchTermToUse = searchTerm.toLowerCase()

    const matchingBlocks = blocks.reduce((matchedBlocks, block) => {
      const blockLabel = getBlockLabel(block, i18n)
      if (blockLabel.includes(searchTermToUse)) matchedBlocks.push(block)
      return matchedBlocks
    }, [])

    setFilteredBlocks(matchingBlocks)
  }, [searchTerm, blocks, i18n])

  return (
    <Drawer
      slug={drawerSlug}
      title={t('addLabel', { label: getTranslation(labels.singular, i18n) })}
    >
      <BlockSearch setSearchTerm={setSearchTerm} />
      <div className={`${baseClass}__blocks-wrapper`}>
        <ul className={`${baseClass}__blocks`}>
          {filteredBlocks?.map((block, index) => {
            const { imageAltText, imageURL, labels: blockLabels, slug } = block

            return (
              <li className={`${baseClass}__block`} key={index}>
                <ThumbnailCard
                  alignLabel="center"
                  label={getTranslation(blockLabels.singular, i18n)}
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
