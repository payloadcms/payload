'use client'
import type { I18nClient } from '@payloadcms/translations'
import type { ClientBlock, ClientWidget, Labels } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { toWords } from 'payload/shared'
import React, { useEffect, useMemo, useState } from 'react'

import { DefaultBlockImage } from '../../graphics/DefaultBlockImage/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Drawer } from '../Drawer/index.js'
import { ThumbnailCard } from '../ThumbnailCard/index.js'
import './index.scss'
import { ItemSearch } from './ItemSearch/index.js'

export type DrawerItem = ClientBlock | ClientWidget

export type ItemsDrawerProps = {
  readonly addRowIndex?: number
  readonly drawerSlug: string
  readonly items: (DrawerItem | string)[]
  readonly labels?: Labels
  readonly onItemClick: (item: DrawerItem, index?: number) => Promise<void> | void
  readonly searchPlaceholder?: string
  readonly title?: string
}

const baseClass = 'items-drawer'

const getItemLabel = (item: DrawerItem, i18n: I18nClient): string => {
  // Handle ClientBlock
  if ('labels' in item && item.labels?.singular) {
    if (typeof item.labels.singular === 'string') {
      return item.labels.singular.toLowerCase()
    }
    if (typeof item.labels.singular === 'object') {
      return getTranslation(item.labels.singular, i18n).toLowerCase()
    }
  }

  // Handle ClientWidget with label (already resolved from function on server)
  if ('label' in item && item.label) {
    if (typeof item.label === 'string') {
      return item.label.toLowerCase()
    }
    if (typeof item.label === 'object') {
      return getTranslation(item.label, i18n).toLowerCase()
    }
  }

  // Fallback to slug
  if ('slug' in item) {
    return toWords(item.slug).toLowerCase()
  }

  return ''
}

const getItemSlug = (item: DrawerItem): string => {
  return item.slug
}

const getItemImageInfo = (item: DrawerItem) => {
  if ('images' in item && item.images?.thumbnail) {
    const thumbnail = item.images.thumbnail
    return {
      imageAltText: typeof thumbnail === 'string' ? undefined : thumbnail.alt,
      imageURL: typeof thumbnail === 'string' ? thumbnail : thumbnail.url,
    }
  }
  if ('imageURL' in item) {
    return {
      imageAltText: item.imageAltText,
      imageURL: item.imageURL,
    }
  }
  return { imageAltText: undefined, imageURL: undefined }
}

const getItemDisplayLabel = (item: DrawerItem, i18n: I18nClient): string => {
  // Handle ClientBlock
  if ('labels' in item && item.labels?.singular) {
    return getTranslation(item.labels.singular, i18n)
  }

  // Handle ClientWidget with label (already resolved from function on server)
  if ('label' in item && item.label) {
    if (typeof item.label === 'string') {
      return item.label
    }
    if (typeof item.label === 'object') {
      return getTranslation(item.label, i18n)
    }
  }

  // Fallback to slug - convert to human-readable label
  return toWords(item.slug)
}

export const ItemsDrawer: React.FC<ItemsDrawerProps> = (props) => {
  const { addRowIndex, drawerSlug, items, labels, onItemClick, searchPlaceholder, title } = props

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredItems, setFilteredItems] = useState(items)
  const { closeModal, isModalOpen } = useModal()
  const { i18n, t } = useTranslation()
  const { config } = useConfig()

  const itemGroups = useMemo(() => {
    const groups: Record<string, (DrawerItem | string)[]> = {
      _none: [],
    }
    filteredItems.forEach((item) => {
      if (typeof item === 'object' && 'admin' in item && item.admin?.group) {
        const group = item.admin.group
        const label = typeof group === 'string' ? group : getTranslation(group, i18n)

        if (Object.hasOwn(groups, label)) {
          groups[label].push(item)
        } else {
          groups[label] = [item]
        }
      } else {
        groups._none.push(item)
      }
    })
    return groups
  }, [filteredItems, i18n])

  useEffect(() => {
    if (!isModalOpen(drawerSlug)) {
      setSearchTerm('')
    }
  }, [isModalOpen, drawerSlug])

  useEffect(() => {
    const searchTermToUse = searchTerm.toLowerCase()

    const matchingItems = items?.reduce((matchedItems, _item) => {
      let item: DrawerItem

      if (typeof _item === 'string') {
        // Handle string references (for blocks)
        item = config.blocksMap?.[_item] as DrawerItem
      } else {
        item = _item
      }

      if (item) {
        const itemLabel = getItemLabel(item, i18n)
        if (itemLabel.includes(searchTermToUse)) {
          matchedItems.push(item)
        }
      }
      return matchedItems
    }, [] as DrawerItem[])

    setFilteredItems(matchingItems || [])
  }, [searchTerm, items, i18n, config.blocksMap])

  const finalTitle =
    title ||
    (labels
      ? t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })
      : t('fields:addNew'))

  return (
    <Drawer slug={drawerSlug} title={finalTitle}>
      <ItemSearch
        placeholder={searchPlaceholder || t('fields:searchForBlock')}
        setSearchTerm={setSearchTerm}
      />
      <div className={`${baseClass}__items-wrapper`}>
        <ul className={`${baseClass}__item-groups`}>
          {Object.entries(itemGroups).map(([groupLabel, groupItems]) =>
            !groupItems.length ? null : (
              <li
                className={[
                  `${baseClass}__item-group`,
                  groupLabel === '_none' && `${baseClass}__item-group-none`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={groupLabel}
              >
                {groupLabel !== '_none' && (
                  <h3 className={`${baseClass}__item-group-label`}>{groupLabel}</h3>
                )}
                <ul className={`${baseClass}__items`}>
                  {groupItems.map((_item, index) => {
                    const item =
                      typeof _item === 'string' ? (config.blocksMap?.[_item] as DrawerItem) : _item

                    if (!item) {
                      return null
                    }

                    const { imageAltText, imageURL } = getItemImageInfo(item)
                    const displayLabel = getItemDisplayLabel(item, i18n)

                    return (
                      <li className={`${baseClass}__item`} key={index}>
                        <ThumbnailCard
                          alignLabel="center"
                          label={displayLabel}
                          onClick={() => {
                            void onItemClick(item, addRowIndex)
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
