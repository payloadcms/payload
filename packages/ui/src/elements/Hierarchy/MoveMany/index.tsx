'use client'
import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useMemo } from 'react'

import type { SelectionWithPath } from '../Modal/types.js'

import { ArrowIcon } from '../../../icons/Arrow/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { ListSelectionButton } from '../../ListSelection/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
import { useHierarchyModal } from '../Modal/useHierarchyModal.js'
import { moveDocuments } from '../move/moveDocuments.js'
import './index.css'

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
  // e.g. "Folder" / "Tag" - the hierarchy collection the selected documents are filed under.
  const hierarchyLabel = getTranslation(hierarchyCollectionConfig?.labels?.singular, i18n)

  // Check if hierarchy has a valid parentFieldName
  const canMove = parentFieldName !== undefined

  // Performs the move immediately - there is no separate confirmation step, so the browse
  // modal is closed as soon as a destination is chosen rather than staying open behind one.
  const performMove = useCallback(
    async (destination: { id: null | number | string; title: string }) => {
      const { hasErrors, totalMoved } = await moveDocuments({
        apiRoute: api,
        destination,
        i18n,
        label,
        locale,
        parentFieldName,
        selections,
        t,
      })

      if (!hasErrors || totalMoved > 0) {
        onSuccess?.()
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

  // Every document in a folder-scoped listing shares that folder, so a known parent is what makes
  // "Remove from Folder" safe to offer for the whole selection.
  const canRemoveFromFolder = currentParentID !== null && currentParentID !== undefined && canMove

  const handleRemoveFromFolder = useCallback(async () => {
    await performMove({ id: null, title: t('hierarchy:noParent') })
  }, [performMove, t])

  if (count === 0 || !canMove) {
    return null
  }

  return (
    <React.Fragment>
      {canRemoveFromFolder ? (
        <Popup
          caret={false}
          className={`${baseClass}__popup`}
          horizontalAlign="left"
          portalClassName={`${baseClass}__popup-content`}
          render={({ close }) => (
            <PopupList.MenuItem>
              <PopupList.Button
                icon={<ArrowIcon direction="right" />}
                onClick={() => {
                  close()
                  openHierarchyModal()
                }}
              >
                Move to...
              </PopupList.Button>
              <PopupList.Button
                icon={<XIcon />}
                onClick={() => {
                  close()
                  void handleRemoveFromFolder()
                }}
              >
                {`Remove from ${hierarchyLabel}`}
              </PopupList.Button>
            </PopupList.MenuItem>
          )}
          renderButton={({ active, onClick, onKeyDown }) => (
            <ListSelectionButton
              aria-label={t('general:move')}
              className={`${baseClass}__toggle`}
              extraButtonProps={{
                'aria-expanded': active,
                'aria-haspopup': 'menu',
                onKeyDown,
              }}
              onClick={onClick}
              selected={active}
            >
              {t('general:move')}
            </ListSelectionButton>
          )}
          size="fit-content"
          verticalAlign="bottom"
        />
      ) : (
        <ListSelectionButton
          aria-label={t('general:move')}
          className={`${baseClass}__toggle`}
          onClick={openHierarchyModal}
        >
          {t('general:move')}
        </ListSelectionButton>
      )}
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
