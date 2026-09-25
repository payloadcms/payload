'use client'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Chip } from '../../Chip/index.js'
import { Spinner } from '../../Spinner/index.js'
import './SelectedHierarchies.css'

const baseClass = 'selected-hierarchies'

type HierarchyItem = {
  id: number | string
  title: string
}

export type SelectedHierarchiesProps = {
  hierarchySlug: string
  Icon?: React.ReactNode
  onRemove: ({ id }: { id: number | string }) => void
  readOnly?: boolean
  selectedIds: (number | string)[]
}

export const SelectedHierarchies: React.FC<SelectedHierarchiesProps> = ({
  hierarchySlug,
  Icon,
  onRemove,
  readOnly = false,
  selectedIds,
}) => {
  const { config, getEntityConfig } = useConfig()
  const { i18n } = useTranslation()
  const [items, setItems] = useState<HierarchyItem[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const prevSelectedIdsRef = useRef<string>('')

  const {
    routes: { api },
    serverURL,
  } = config

  const collectionConfig = getEntityConfig({ collectionSlug: hierarchySlug })

  const selectedIdsKey = useMemo(() => selectedIds.slice().sort().join(','), [selectedIds])

  useEffect(() => {
    if (!selectedIds || selectedIds.length === 0) {
      setItems([])
      setIsInitialLoad(false)
      return
    }

    if (prevSelectedIdsRef.current === selectedIdsKey) {
      return
    }
    prevSelectedIdsRef.current = selectedIdsKey

    const fetchItems = async () => {
      const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'

      const query = {
        depth: 0,
        limit: selectedIds.length,
        select: {
          [useAsTitle]: true,
        },
        where: {
          id: {
            in: selectedIds,
          },
        },
      }

      const queryString = qs.stringify(query)

      try {
        const url = formatAdminURL({
          apiRoute: api,
          path: `/${hierarchySlug}?${queryString}`,
          serverURL,
        })

        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const fetchedItems: HierarchyItem[] = data.docs.map((doc: Record<string, unknown>) => {
            const docId = doc.id as number | string
            const titleValue = doc[useAsTitle] ?? docId
            const title =
              typeof titleValue === 'string' || typeof titleValue === 'number'
                ? String(titleValue)
                : String(docId)
            return {
              id: docId,
              title,
            }
          })

          // Order by selectedIds to preserve selection order
          const orderedItems = selectedIds
            .map((id) => fetchedItems.find((item) => item.id === id))
            .filter((item): item is HierarchyItem => item !== undefined)

          setItems(orderedItems)
        }
      } catch {
        // Silently fail - items will remain empty
      } finally {
        setIsInitialLoad(false)
      }
    }

    void fetchItems()
  }, [selectedIds, selectedIdsKey, hierarchySlug, collectionConfig, serverURL, api, i18n.language])

  if (isInitialLoad) {
    return (
      <div className={`${baseClass}__loading`}>
        <Spinner size="sm" />
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__pills`}>
        {items.map((item) => (
          <SelectedPill
            Icon={Icon}
            item={item}
            key={item.id}
            onRemove={onRemove}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  )
}

type SelectedPillProps = {
  Icon?: React.ReactNode
  item: HierarchyItem
  onRemove: ({ id }: { id: number | string }) => void
  readOnly: boolean
}

const SelectedPill: React.FC<SelectedPillProps> = ({ Icon, item, onRemove, readOnly }) => {
  return (
    <Chip
      className={`${baseClass}__pill`}
      disabled={readOnly}
      icon={Icon}
      onRemove={() => onRemove({ id: item.id })}
      size="medium"
    >
      {item.title}
    </Chip>
  )
}
