'use client'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { XIcon } from '../../../icons/X/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Pill } from '../../Pill/index.js'
import './SelectedTaxonomies.scss'
import { Spinner } from '../../Spinner/index.js'

const baseClass = 'selected-taxonomies'

type TaxonomyItem = {
  id: number | string
  title: string
}

export type SelectedTaxonomiesProps = {
  onRemove: (id: number | string) => void
  readOnly?: boolean
  selectedIds: (number | string)[]
  taxonomySlug: string
}

export const SelectedTaxonomies: React.FC<SelectedTaxonomiesProps> = ({
  onRemove,
  readOnly = false,
  selectedIds,
  taxonomySlug,
}) => {
  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()
  const [items, setItems] = useState<TaxonomyItem[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const prevSelectedIdsRef = useRef<string>('')

  const {
    routes: { api },
    serverURL,
  } = config

  const collectionConfig = getEntityConfig({ collectionSlug: taxonomySlug })

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
          path: `/${taxonomySlug}?${queryString}`,
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
          const fetchedItems: TaxonomyItem[] = data.docs.map((doc: Record<string, unknown>) => {
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
            .filter((item): item is TaxonomyItem => item !== undefined)

          setItems(orderedItems)
        }
      } catch {
        // Silently fail - items will remain empty
      } finally {
        setIsInitialLoad(false)
      }
    }

    void fetchItems()
  }, [selectedIds, selectedIdsKey, taxonomySlug, collectionConfig, serverURL, api, i18n.language])

  if (isInitialLoad) {
    return (
      <div className={`${baseClass}__loading`}>
        <Spinner size="small" />
      </div>
    )
  }

  if (items.length === 0) {
    const label = collectionConfig?.labels?.plural
    const translatedLabel = label ? getTranslation(label, i18n) : taxonomySlug

    return (
      <div className={`${baseClass}__empty`}>
        {t('general:noLabel', { label: translatedLabel })}
      </div>
    )
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__pills`}>
        {items.map((item) => (
          <SelectedPill item={item} key={item.id} onRemove={onRemove} readOnly={readOnly} />
        ))}
      </div>
    </div>
  )
}

type SelectedPillProps = {
  item: TaxonomyItem
  onRemove: (id: number | string) => void
  readOnly: boolean
}

const SelectedPill: React.FC<SelectedPillProps> = ({ item, onRemove, readOnly }) => {
  const { t } = useTranslation()

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemove(item.id)
  }

  return (
    <Pill className={`${baseClass}__pill`} pillStyle="light" size="small">
      <span className={`${baseClass}__pill-label`}>{item.title}</span>
      <button
        aria-label={t('general:remove')}
        className={`${baseClass}__pill-remove`}
        disabled={readOnly}
        onClick={readOnly ? undefined : handleRemove}
        type="button"
      >
        <XIcon />
      </button>
    </Pill>
  )
}
