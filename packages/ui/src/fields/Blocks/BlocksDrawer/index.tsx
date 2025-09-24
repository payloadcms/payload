'use client'
import type { I18nClient } from '@payloadcms/translations'
import type { ClientBlock, Labels } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useEffect, useMemo, useState } from 'react'

import { Drawer } from '../../../elements/Drawer/index.js'
import { ThumbnailCard } from '../../../elements/ThumbnailCard/index.js'
import { DefaultBlockImage } from '../../../graphics/DefaultBlockImage/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.scss'
import { BlockSearch } from './BlockSearch/index.js'

export type Props = {
  readonly addRow: (index: number, blockType?: string) => Promise<void> | void
  readonly addRowIndex: number
  readonly blocks: (ClientBlock | string)[]
  readonly drawerSlug: string
  readonly labels: Labels
}

const baseClass = 'blocks-drawer'

const getBlockLabel = (block: ClientBlock, i18n: I18nClient) => {
  if (typeof block.labels.singular === 'string') {
    return block.labels.singular.toLowerCase()
  }
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
  const { config } = useConfig()

  const blockGroups = useMemo(() => {
    const groups: Record<string, (ClientBlock | string)[]> = {
      _none: [],
    }
    filteredBlocks.forEach((block) => {
      if (typeof block === 'object' && block.admin?.group) {
        const group = block.admin.group
        const label = typeof group === 'string' ? group : getTranslation(group, i18n)

        if (Object.hasOwn(groups, label)) {
          groups[label].push(block)
        } else {
          groups[label] = [block]
        }
      } else {
        groups._none.push(block)
      }
    })
    return groups
  }, [filteredBlocks, i18n])

  useEffect(() => {
    if (!isModalOpen(drawerSlug)) {
      setSearchTerm('')
    }
  }, [isModalOpen, drawerSlug])

  useEffect(() => {
    const searchTermToUse = searchTerm.toLowerCase()

    const matchingBlocks = blocks?.reduce((matchedBlocks, _block) => {
      const block = typeof _block === 'string' ? config.blocksMap[_block] : _block
      const blockLabel = getBlockLabel(block, i18n)
      if (blockLabel.includes(searchTermToUse)) {
        matchedBlocks.push(block)
      }
      return matchedBlocks
    }, [])

    setFilteredBlocks(matchingBlocks)
  }, [searchTerm, blocks, i18n, config.blocksMap])

  return (
    <Drawer
      slug={drawerSlug}
      title={t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })}
    >
      <BlockSearch setSearchTerm={setSearchTerm} />
      <div className={`${baseClass}__blocks-wrapper`}>
        <ul className={`${baseClass}__block-groups`}>
          {Object.entries(blockGroups).map(([groupLabel, groupBlocks]) =>
            !groupBlocks.length ? null : (
              <li
                className={[
                  `${baseClass}__block-group`,
                  groupLabel === '_none' && `${baseClass}__block-group-none`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={groupLabel}
              >
                {groupLabel !== '_none' && (
                  <h3 className={`${baseClass}__block-group-label`}>{groupLabel}</h3>
                )}
                <ul className={`${baseClass}__blocks`}>
                  {groupBlocks.map((_block, index) => {
                    const block = typeof _block === 'string' ? config.blocksMap[_block] : _block

                    const { slug, imageAltText, imageURL, labels: blockLabels } = block

                    return (
                      <li className={`${baseClass}__block`} key={index}>
                        <ThumbnailCard
                          alignLabel="center"
                          label={getTranslation(blockLabels?.singular, i18n)}
                          onClick={() => {
                            void addRow(addRowIndex, slug)
                            closeModal(drawerSlug)
                          }}
                          thumbnail={
                            <div className={`${baseClass}__default-image`}>
                              {imageURL ? (
                                <img alt={imageAltText} src={imageURL} />
                              ) : (
                                <DefaultBlockImage />
                              )}
                            </div>
                          }
                        />
                      </li>
                    )
                  })}
                </ul>
              </li>
            ),
          )}
        </ul>
      </div>
    </Drawer>
  )
}
