'use client'
import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { SelectionWithPath } from '../Modal/types.js'

import { useBranchParam } from '../../../providers/Branch/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { requests } from '../../../utilities/api.js'
import {
  getEffectiveHierarchyCollections,
  getHierarchyCollectionRestrictions,
} from '../../../utilities/hierarchyCollectionRestrictions.js'
import { ListSelectionButton } from '../../ListSelection/index.js'
import { HierarchyActionsMenu } from '../ActionsMenu/index.js'
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
  /** Collection slugs required by the selected documents at the destination. */
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
  requiredCollections: requiredCollectionsProp,
  selections,
}: MoveManyProps) {
  const { i18n, t } = useTranslation()
  const currentLocale = useLocale()
  const locale = currentLocale?.code
  const branch = useBranchParam()
  const {
    config: {
      collections,
      routes: { api },
    },
  } = useConfig()

  const { getSelectionsWithMetadata } = useDocumentSelection()
  const hierarchyCollectionConfig = collections.find((c) => c.slug === hierarchySlug)

  const { relatedCollectionSlugs } = useMemo(
    () => getHierarchyCollectionRestrictions({ collectionConfig: hierarchyCollectionConfig }),
    [hierarchyCollectionConfig],
  )

  // Compute required collections from selection metadata
  // For related items: add their collection slug
  // For folders: add their allowedCollections values
  const inferredRequiredCollections = useMemo(() => {
    const selectionsWithMeta = getSelectionsWithMetadata()
    const required = new Set<string>()

    for (const [collectionSlug, { selections: items }] of Object.entries(selectionsWithMeta)) {
      if (collectionSlug === hierarchySlug) {
        // For folders, add their allowedCollections to required set
        for (const { metadata } of items) {
          for (const slug of getEffectiveHierarchyCollections({
            allowedCollections: metadata.allowedCollections,
            relatedCollectionSlugs,
          })) {
            required.add(slug)
          }
        }
      } else {
        // For related items, add their collection slug
        required.add(collectionSlug)
      }
    }

    return required.size > 0 ? Array.from(required) : undefined
  }, [getSelectionsWithMetadata, hierarchySlug, relatedCollectionSlugs])

  const requiredCollections = requiredCollectionsProp ?? inferredRequiredCollections

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
      modalTitleLabel:
        labels.length === 1
          ? labels[0]
          : t(totalCount === 1 ? 'general:document' : 'general:documents'),
    }
  }, [selections, collections, i18n, t])

  const parentFieldName = getParentFieldName(hierarchyCollectionConfig)

  // Check if hierarchy has a valid parentFieldName
  const canMove = parentFieldName !== undefined

  const hierarchyLabel =
    getTranslation(hierarchyCollectionConfig?.labels?.singular || hierarchySlug, i18n) ||
    hierarchySlug
  const isMovingRef = useRef(false)
  const [isMoving, setIsMoving] = useState(false)

  const moveDocuments = useCallback(
    async (destination: { id: null | number | string; title: string }) => {
      // A ref, not state, so a second click in the same frame still sees the first move
      if (isMovingRef.current) {
        return
      }

      isMovingRef.current = true
      setIsMoving(true)

      let totalMoved = 0
      let hasErrors = false

      try {
        for (const [collectionSlug, { ids }] of Object.entries(selections)) {
          if (ids.length === 0) {
            continue
          }

          const queryString = qs.stringify(
            {
              branch,
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
              destination: destination.title,
              title: label,
            }),
          )
        }

        if (!hasErrors || totalMoved > 0) {
          closeModal()
          onSuccess?.()
        }
      } catch (_err) {
        toast.error(t('error:unknown'))
      } finally {
        isMovingRef.current = false
        setIsMoving(false)
      }
    },
    [branch, closeModal, selections, parentFieldName, locale, api, i18n, t, label, onSuccess],
  )

  const handleModalSave = useCallback(
    ({ selections: selectionsMap }: { selections: Map<number | string, SelectionWithPath> }) => {
      const firstSelection = selectionsMap.values().next().value

      if (!firstSelection) {
        return
      }

      const destinationTitle =
        firstSelection.path[firstSelection.path.length - 1]?.title || String(firstSelection.id)

      void moveDocuments({ id: firstSelection.id, title: destinationTitle })
    },
    [moveDocuments],
  )

  const handleMoveToRoot = useCallback(() => {
    void moveDocuments({ id: null, title: t('hierarchy:noParent') })
  }, [moveDocuments, t])

  const canRemoveFromHierarchy = currentParentID !== null && currentParentID !== undefined
  const initialSelections =
    currentParentID === null || currentParentID === undefined ? undefined : [currentParentID]

  if (count === 0 || !canMove) {
    return null
  }

  return (
    <React.Fragment>
      <HierarchyActionsMenu
        hasActions={canRemoveFromHierarchy}
        hierarchyLabel={hierarchyLabel}
        onMove={openHierarchyModal}
        onRemove={handleMoveToRoot}
        renderTrigger={(triggerProps) => (
          <ListSelectionButton
            aria-label={t('general:move')}
            className={`${baseClass}__toggle`}
            extraButtonProps={triggerProps?.extraButtonProps}
            onClick={triggerProps?.onClick ?? openHierarchyModal}
            selected={triggerProps?.selected}
          >
            {t('general:move')}
          </ListSelectionButton>
        )}
        showActionIcons
      />
      <HierarchyModal
        confirmLabel={t('general:confirm')}
        hasMany={false}
        initialSelections={initialSelections}
        isBusy={isMoving}
        onMoveToRoot={handleMoveToRoot}
        onSave={handleModalSave}
        showMoveToRoot
        title={t('general:moveCount', { count, label: modalTitleLabel })}
      />
    </React.Fragment>
  )
}
