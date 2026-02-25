'use client'
import type { ClientCollectionConfig } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
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
import { Translation } from '../Translation/index.js'
import './index.scss'

export const baseClass = 'move-many'

type MoveManyProps = {
  /** The hierarchy collection slug (e.g., 'folders') */
  hierarchySlug: string
  /** Icon to display in the hierarchy drawer */
  Icon?: React.ReactNode
  /** When multiple MoveMany components are rendered on the page, this will differentiate them */
  modalPrefix?: string
  /** Callback after successful move */
  onSuccess?: () => void
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
  hierarchySlug,
  Icon,
  modalPrefix,
  onSuccess,
  selections,
}: MoveManyProps) {
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

  const [HierarchyDrawer, , { closeDrawer, openDrawer }] = useHierarchyDrawer({
    collectionSlug: hierarchySlug,
    Icon,
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
        labels.push(collectionLabel)
      }
    }

    return {
      count: totalCount,
      label: labels.join(', '),
    }
  }, [selections, collections, i18n])

  const hierarchyCollectionConfig = collections.find((c) => c.slug === hierarchySlug)
  const parentFieldName = getParentFieldName(hierarchyCollectionConfig)

  // Check if hierarchy has a valid parentFieldName
  const canMove = parentFieldName !== undefined

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
    setDestination({ id: null, title: t('hierarchy:noParent') })
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
            description: json.errors.map((error: { message: string }) => error.message).join('\n'),
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
        closeDrawer()
        onSuccess?.()
      }
    } catch (_err) {
      toast.error(t('error:unknown'))
    } finally {
      setDestination(null)
    }
  }, [
    closeDrawer,
    destination,
    selections,
    parentFieldName,
    locale,
    api,
    i18n,
    t,
    label,
    onSuccess,
  ])

  if (count === 0 || !canMove) {
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
            {destination?.id === null ? (
              <Translation
                elements={{
                  '1': ({ children }) => <strong>{children}</strong>,
                }}
                i18nKey="hierarchy:moveItemsToRootConfirmation"
                t={t}
                variables={{
                  count,
                  label,
                }}
              />
            ) : (
              <Translation
                elements={{
                  '1': ({ children }) => <strong>{children}</strong>,
                }}
                i18nKey="general:moveConfirm"
                t={t}
                variables={{
                  count,
                  destination: destination?.title || '',
                  label,
                }}
              />
            )}
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
