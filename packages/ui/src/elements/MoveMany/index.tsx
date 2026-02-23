'use client'
import type { ClientCollectionConfig, ClientField } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL, getHierarchyFieldName, HIERARCHY_PARENT_FIELD } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { SelectionWithPath } from '../HierarchyDrawer/types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { useHierarchyDrawer } from '../HierarchyDrawer/index.js'
import { ListSelectionButton } from '../ListSelection/index.js'
import './index.scss'

export const baseClass = 'move-many'

type MoveManyProps = {
  /** The hierarchy collection slug (e.g., 'folders') */
  hierarchySlug: string
  /** When multiple MoveMany components are rendered on the page, this will differentiate them */
  modalPrefix?: string
  /** Callback after successful move */
  onSuccess?: () => void
  /** Selections grouped by collection slug */
  selections: Record<string, { ids: (number | string)[] }>
}

/**
 * Determines if items from a collection can be moved within a hierarchy.
 * Returns true if:
 * - The collection IS the hierarchy collection (moving within tree)
 * - The collection has a hasMany:false relationship to the hierarchy
 */
function canMoveCollection(
  collectionConfig: ClientCollectionConfig | undefined,
  hierarchySlug: string,
): boolean {
  if (!collectionConfig) {
    return false
  }

  // Hierarchy items can always be moved within their tree
  if (collectionConfig.slug === hierarchySlug) {
    return true
  }

  // Check for hasMany:false hierarchy relationship
  const hasMovableRelationship = collectionConfig.fields.some((field: ClientField) => {
    if (field.type !== 'relationship') {
      return false
    }

    const relationTo = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]

    if (!relationTo.includes(hierarchySlug)) {
      return false
    }

    if (field.hasMany) {
      return false
    }

    return field.admin?.custom?.hierarchy === true
  })

  return hasMovableRelationship
}

/**
 * Gets the parent field name for a collection within a hierarchy.
 */
function getParentFieldName(collectionSlug: string, hierarchySlug: string): string {
  if (collectionSlug === hierarchySlug) {
    return HIERARCHY_PARENT_FIELD
  }

  return getHierarchyFieldName(hierarchySlug)
}

export function MoveMany({ hierarchySlug, modalPrefix, onSuccess, selections }: MoveManyProps) {
  const { i18n, t } = useTranslation()
  const { code: locale } = useLocale()
  const { openModal } = useModal()
  const {
    config: {
      collections,
      routes: { api },
    },
  } = useConfig()

  const [destination, setDestination] = useState<{
    id: null | number | string
    title: string
  } | null>(null)

  const confirmMoveDrawerSlug = `${modalPrefix ? `${modalPrefix}-` : ''}confirm-move-many`

  // Get useAsTitle from hierarchy collection config
  const hierarchyConfig = collections.find((c) => c.slug === hierarchySlug)
  const useAsTitle = hierarchyConfig?.admin?.useAsTitle

  const [HierarchyDrawer, , { openDrawer }] = useHierarchyDrawer({
    collectionSlug: hierarchySlug,
    useAsTitle,
  })

  // Calculate total count and label
  const { count, label } = useMemo(() => {
    let totalCount = 0
    const labels: string[] = []

    for (const [collectionSlug, { ids }] of Object.entries(selections)) {
      const config = collections.find((c) => c.slug === collectionSlug)

      if (config && ids.length > 0) {
        totalCount += ids.length
        const collectionLabel = getTranslation(
          ids.length > 1 ? config.labels.plural : config.labels.singular,
          i18n,
        )
        labels.push(`${ids.length} ${collectionLabel}`)
      }
    }

    return {
      count: totalCount,
      label: labels.join(', '),
    }
  }, [selections, collections, i18n])

  // Check if all selected items can be moved
  const allCanMove = useMemo(() => {
    return Object.keys(selections).every((collectionSlug) => {
      const config = collections.find((c) => c.slug === collectionSlug)
      return canMoveCollection(config, hierarchySlug)
    })
  }, [selections, collections, hierarchySlug])

  const handleDrawerSave = useCallback(
    (selectionsMap: Map<number | string, SelectionWithPath>) => {
      if (selectionsMap.size === 0) {
        return
      }

      const firstSelection = selectionsMap.values().next().value
      const destinationId = firstSelection?.id
      const destinationTitle =
        firstSelection?.path?.[firstSelection.path.length - 1]?.title || String(destinationId)

      setDestination({ id: destinationId, title: destinationTitle })
      openModal(confirmMoveDrawerSlug)
    },
    [openModal, confirmMoveDrawerSlug],
  )

  const handleMoveToRoot = useCallback(() => {
    setDestination({ id: null, title: t('folder:noFolder') })
    openModal(confirmMoveDrawerSlug)
  }, [openModal, confirmMoveDrawerSlug, t])

  const handleConfirmMove = useCallback(async () => {
    if (destination === null) {
      return
    }

    let totalMoved = 0
    let hasErrors = false

    try {
      for (const [collectionSlug, { ids }] of Object.entries(selections)) {
        const collectionConfig = collections.find((c) => c.slug === collectionSlug)

        if (!collectionConfig || !canMoveCollection(collectionConfig, hierarchySlug)) {
          continue
        }

        if (ids.length === 0) {
          continue
        }

        const fieldName = getParentFieldName(collectionSlug, hierarchySlug)
        const queryString = qs.stringify(
          {
            locale,
            where: { id: { in: ids } },
          },
          { addQueryPrefix: true },
        )

        const url = formatAdminURL({
          apiRoute: api,
          path: `/${collectionSlug}${queryString}`,
        })

        const response = await requests.patch(url, {
          body: JSON.stringify({ [fieldName]: destination.id }),
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
          },
        })

        const json = await response.json()

        if (response.status >= 400) {
          hasErrors = true

          if (json?.errors?.length > 0) {
            toast.error(json.message || t('error:unknown'), {
              description: json.errors
                .map((error: { message: string }) => error.message)
                .join('\n'),
            })
          } else {
            toast.error(json?.message || t('error:unknown'))
          }

          continue
        }

        const movedCount = json?.docs?.length || 0
        totalMoved += movedCount

        if (json?.errors?.length > 0) {
          hasErrors = true
          toast.error(json.message, {
            description: json.errors.map((error: { message: string }) => error.message).join('\n'),
          })
        }
      }

      if (totalMoved > 0) {
        const successKey =
          destination.id === null ? 'folder:itemsMovedToRoot' : 'folder:itemsMovedToFolder'

        toast.success(
          t(successKey, {
            folderName: destination.title,
            title: label,
          }),
        )
      }

      if (!hasErrors || totalMoved > 0) {
        onSuccess?.()
      }
    } catch (_err) {
      toast.error(t('error:unknown'))
    } finally {
      setDestination(null)
    }
  }, [destination, selections, collections, hierarchySlug, locale, api, i18n, t, label, onSuccess])

  if (count === 0 || !allCanMove) {
    return null
  }

  return (
    <React.Fragment>
      <ListSelectionButton
        aria-label={t('general:move')}
        className={`${baseClass}__toggle`}
        onClick={openDrawer}
      >
        {t('general:move')}
      </ListSelectionButton>
      <HierarchyDrawer
        hasMany={false}
        onMoveToRoot={handleMoveToRoot}
        onSave={handleDrawerSave}
        showMoveToRoot
      />
      <ConfirmationModal
        body={
          <p>
            {destination?.id === null
              ? t('folder:moveItemsToRootConfirmation', { count, label })
              : t('general:moveConfirm', {
                  count,
                  destination: destination?.title || '',
                  label,
                })}
          </p>
        }
        confirmingLabel={t('general:moving')}
        heading={t('general:confirmMove')}
        modalSlug={confirmMoveDrawerSlug}
        onConfirm={handleConfirmMove}
      />
    </React.Fragment>
  )
}
