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
import './index.css'
import { DraggableWidgetCard } from './DraggableWidgetCard/index.js'
import { ItemSearch } from './ItemSearch/index.js'
import { WidgetPreview } from './WidgetPreview/index.js'
import { WidgetPreviewProvider } from './WidgetPreviewProvider/index.js'

export type DrawerItem = ClientBlock | ClientWidget

export type ItemsDrawerProps = {
  readonly addRowIndex?: number
  readonly drawerSlug: string
  readonly isDraggable?: boolean
  readonly items: (DrawerItem | string)[]
  readonly labels?: Labels
  readonly onItemClick: (item: DrawerItem, index?: number) => Promise<void> | void
  readonly searchPlaceholder?: string
  readonly title?: string
  readonly variant?: 'default' | 'widgets'
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
  if ('admin' in item && item?.admin?.images?.thumbnail) {
    const thumbnail = item.admin?.images.thumbnail
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
  const {
    addRowIndex,
    drawerSlug,
    isDraggable = false,
    items,
    labels,
    onItemClick,
    searchPlaceholder,
    title,
    variant = 'default',
  } = props
  const isWidgetPicker = variant === 'widgets'
  const PreviewProvider = isWidgetPicker ? WidgetPreviewProvider : React.Fragment

  const [searchTerm, setSearchTerm] = useState('')
  const [resultsAnnouncement, setResultsAnnouncement] = useState('')
  const { closeModal, isModalOpen } = useModal()
  const { i18n, t } = useTranslation()
  const { config } = useConfig()
  const isOpen = isModalOpen(drawerSlug)

  const filteredItems = useMemo(() => {
    const searchTermToUse = searchTerm.toLowerCase()

    const widgetSlugs = new Set<string>()
    const matchingItems = items?.reduce((matchedItems, _item) => {
      let item: DrawerItem

      if (typeof _item === 'string') {
        // Handle string references (for blocks)
        item = config.blocksMap?.[_item]
      } else {
        item = _item
      }

      if (item) {
        if (isWidgetPicker && widgetSlugs.has(item.slug)) {
          return matchedItems
        }
        widgetSlugs.add(item.slug)
        const itemLabel = getItemLabel(item, i18n)
        if (itemLabel.includes(searchTermToUse)) {
          matchedItems.push(item)
        }
      }
      return matchedItems
    }, [] as DrawerItem[])

    return matchingItems || []
  }, [searchTerm, items, i18n, config.blocksMap, isWidgetPicker])

  useEffect(() => {
    if (!isOpen) {
      setResultsAnnouncement('')
      return
    }

    const timeout = setTimeout(() => {
      setResultsAnnouncement(
        searchTerm
          ? t('general:searchResults', { count: filteredItems.length, search: searchTerm })
          : t('hierarchy:searchResults', { count: filteredItems.length }),
      )
    }, 300)

    return () => clearTimeout(timeout)
  }, [filteredItems.length, isOpen, searchTerm, t])

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

  const finalTitle =
    title ||
    (labels
      ? t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })
      : t('fields:addNew'))

  return (
    <Drawer
      className={isWidgetPicker ? `${baseClass}--widgets` : undefined}
      slug={drawerSlug}
      title={finalTitle}
    >
      <PreviewProvider>
        <span aria-atomic="true" className="sr-only" role="status">
          {resultsAnnouncement}
        </span>
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
                    {groupItems.map((_item) => {
                      const item =
                        typeof _item === 'string'
                          ? (config.blocksMap?.[_item] as DrawerItem)
                          : _item

                      if (!item) {
                        return null
                      }

                      const { imageAltText, imageURL } = getItemImageInfo(item)
                      const displayLabel = getItemDisplayLabel(item, i18n)
                      const description =
                        isWidgetPicker && 'description' in item && item.description
                          ? getTranslation(item.description, i18n)
                          : undefined

                      const Card =
                        isWidgetPicker && isDraggable ? DraggableWidgetCard : ThumbnailCard
                      const dragProps = { drawerSlug, widget: item as ClientWidget }
                      return (
                        <li className={`${baseClass}__item`} key={item.slug}>
                          <Card
                            {...dragProps}
                            alignLabel={isWidgetPicker ? 'left' : 'center'}
                            description={description}
                            label={displayLabel}
                            onClick={() => {
                              void onItemClick(item, addRowIndex)
                              closeModal(drawerSlug)
                            }}
                            shouldRenderThumbnailOutsideButton={isWidgetPicker}
                            thumbnail={
                              isWidgetPicker ? (
                                <WidgetPreview widget={item as ClientWidget} />
                              ) : (
                                <div className={`${baseClass}__default-image`}>
                                  {imageURL ? (
                                    <img alt={imageAltText} src={imageURL} />
                                  ) : (
                                    <DefaultBlockImage />
                                  )}
                                </div>
                              )
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
      </PreviewProvider>
    </Drawer>
  )
}
