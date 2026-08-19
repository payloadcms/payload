'use client'
import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import type { SelectionWithPath } from '../Modal/types.js'

import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { requests } from '../../../utilities/api.js'
import { ListSelectionButton } from '../../ListSelection/index.js'
import { useHierarchyModal } from '../Modal/useHierarchyModal.js'

export const baseClass = 'move-many'

type MoveManyProps = {
  /** Current parent ID - modal will open expanded to this location */
  currentParentID?: null | number | string
  /** The hierarchy collection slug (e.g., 'folders') */
  hierarchySlug: string
  /** Icon to display in the hierarchy modal */
  Icon?: React.ReactNode
  /** Callback after successful move */
  onSuccess?: () => void
  /**
   * Collection slugs the destination folder must accept (via its `allowedCollections` config).
   * Pass the selected items' own collection slugs, plus any `allowedCollections` of selected
   * folders, so the picker only shows folders that can hold every selected item.
   */
  requiredCollections?: string[]
  /** Selections grouped by collection slug */
  selections: Record<string, { ids: (number | string)[] }>
}

/**
 * Gets the parent field name from the hierarchy config.
 */
function getParentFieldName(
  hierarchyConfig: ClientCollectionConfig | undefined,
): string | undefined {
  const config =
    hierarchyConfig?.hierarchy && typeof hierarchyConfig.hierarchy === 'object'
      ? hierarchyConfig.hierarchy
      : undefined
  return config?.parentFieldName
}

export function MoveMany({
  currentParentID,
  hierarchySlug,
  Icon,
  onSuccess,
  requiredCollections,
  selections,
}: MoveManyProps) {
  const { i18n, t } = useTranslation()
  const { code: locale } = useLocale()
  const {
    config: {
      collections,
      routes: { api },
    },
  } = useConfig()

  // Folders being moved cannot be selected as destination (can't move into themselves)
  const disabledIds = useMemo(() => {
    const parentIds = selections[hierarchySlug]?.ids
    return parentIds?.length ? new Set(parentIds) : undefined
  }, [selections, hierarchySlug])

  const [HierarchyModal, , { closeModal, openModal: openHierarchyModal }] = useHierarchyModal({
    disabledIds,
    filterByCollection: requiredCollections,
    hierarchyCollectionSlug: hierarchySlug,
    Icon,
  })

  // Calculate total count and label
  const { count, label, modalTitleLabel } = useMemo(() => {
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
        labels.push(collectionLabel)
      }
    }

    return {
      count: totalCount,
      label: labels.join(', '),
      // Mixed selections read better as "Move 3 Documents" than "Move 3 Posts, Pages"
      modalTitleLabel:
        labels.length === 1
          ? labels[0]
          : t(totalCount === 1 ? 'general:document' : 'general:documents'),
    }
  }, [selections, collections, i18n, t])

  const hierarchyCollectionConfig = collections.find((c) => c.slug === hierarchySlug)
  const parentFieldName = getParentFieldName(hierarchyCollectionConfig)

  // Check if hierarchy has a valid parentFieldName
  const canMove = parentFieldName !== undefined

  // Performs the move immediately - there is no separate confirmation step, so the browse
  // modal is closed as soon as a destination is chosen rather than staying open behind one.
  const performMove = useCallback(
    async (destination: { id: null | number | string; title: string }) => {
      let totalMoved = 0
      let hasErrors = false

      try {
        for (const [collectionSlug, { ids }] of Object.entries(selections)) {
          if (ids.length === 0) {
            continue
          }

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
            body: JSON.stringify({ [parentFieldName]: destination.id }),
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
              credentials: 'include',
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
              description: json.errors
                .map((error: { message: string }) => error.message)
                .join('\n'),
            })
          }
        }

        if (totalMoved > 0) {
          const successKey =
            destination.id === null ? 'hierarchy:itemsMovedToRoot' : 'hierarchy:itemsMovedTo'

          toast.success(
            t(successKey, {
              count: totalMoved,
              destination: destination.title,
              label,
            }),
          )
        }

        if (!hasErrors || totalMoved > 0) {
          onSuccess?.()
        }
      } catch (_err) {
        toast.error(t('error:unknown'))
      }
    },
    [selections, parentFieldName, locale, api, i18n, t, label, onSuccess],
  )

  const handleDrawerSave = useCallback(
    ({ selections: selectionsMap }: { selections: Map<number | string, SelectionWithPath> }) => {
      if (selectionsMap.size === 0) {
        return
      }

      const firstSelection = selectionsMap.values().next().value
      const destinationId = firstSelection?.id ?? null
      const destinationTitle =
        firstSelection?.path?.[firstSelection.path.length - 1]?.title || String(destinationId)

      closeModal()
      void performMove({ id: destinationId, title: destinationTitle })
    },
    [closeModal, performMove],
  )

  const handleMoveToRoot = useCallback(() => {
    closeModal()
    void performMove({ id: null, title: t('hierarchy:noParent') })
  }, [closeModal, performMove, t])

  if (count === 0 || !canMove) {
    return null
  }

  return (
    <React.Fragment>
      <ListSelectionButton
        aria-label={t('general:move')}
        className={`${baseClass}__toggle`}
        onClick={openHierarchyModal}
      >
        {t('general:move')}
      </ListSelectionButton>
      <HierarchyModal
        hasMany={false}
        initialSelections={currentParentID ? [currentParentID] : null}
        onMoveToRoot={handleMoveToRoot}
        onSave={handleDrawerSave}
        showMoveToRoot
        title={t('general:moveCount', { count, label: modalTitleLabel })}
      />
    </React.Fragment>
  )
}
