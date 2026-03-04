'use client'
import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { HierarchyDrawerInternalProps, SelectionWithPath } from '../types.js'

import { useEffectEvent } from '../../../hooks/useEffectEvent.js'
import { TagIcon } from '../../../icons/Tag/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Drawer } from '../../Drawer/index.js'
import { DrawerActionHeader } from '../../DrawerActionHeader/index.js'
import { HierarchyColumnBrowser } from '../../HierarchyColumnBrowser/index.js'
import { fetchAncestorPath } from '../fetchAncestorPath.js'
import './index.scss'

export const baseClass = 'hierarchy-drawer'

export const HierarchyDrawerContent: React.FC<HierarchyDrawerInternalProps> = ({
  closeDrawer,
  collectionSlug,
  disabledIds,
  drawerSlug,
  filterByCollection,
  hasMany = false,
  Icon,
  initialSelections,
  onMoveToRoot,
  onSave,
  parentFieldName,
  showMoveToRoot,
  useAsTitle,
}) => {
  const { i18n, t } = useTranslation()
  const { closeModal } = useModal()
  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const collectionLabel = collectionConfig
    ? getTranslation(collectionConfig.labels?.plural || collectionSlug, i18n)
    : collectionSlug

  const parentFieldName_internal =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy.parentFieldName
      : parentFieldName

  const [initialExpandedPath, setInitialExpandedPath] = useState<(number | string)[] | undefined>()
  const [isPathReady, setIsPathReady] = useState(false)
  const hasLoadedPathRef = React.useRef(false)
  const firstSelection = initialSelections?.[0]

  const loadAncestorPath = useEffectEvent(async (itemId?: number | string) => {
    if (!itemId) {
      setIsPathReady(true)
      return
    }

    try {
      const path = await fetchAncestorPath({
        api,
        collectionSlug,
        itemId,
        parentFieldName: parentFieldName_internal,
        serverURL,
      })
      setInitialExpandedPath(path)
    } catch {
      // Silently handle fetch errors - will just start at root
    } finally {
      setIsPathReady(true)
    }
  })

  // Load ancestor path on mount
  useEffect(() => {
    if (hasLoadedPathRef.current) {
      return
    }
    hasLoadedPathRef.current = true
    void loadAncestorPath(firstSelection)
  }, [firstSelection])

  const [selections, setSelections] = useState<Map<number | string, SelectionWithPath>>(() => {
    const map = new Map<number | string, SelectionWithPath>()

    if (initialSelections) {
      for (const id of initialSelections) {
        map.set(id, { id, path: [] })
      }
    }

    return map
  })

  const selectedIds = useMemo(() => new Set(selections.keys()), [selections])

  // For now, ancestorsWithSelections is empty - will be computed when we have path tracking
  const ancestorsWithSelections = useMemo(() => new Set<number | string>(), [])

  const handleCancel = useCallback(() => {
    closeModal(drawerSlug)
    closeDrawer()
  }, [closeModal, closeDrawer, drawerSlug])

  const handleSave = useCallback(() => {
    onSave(selections, closeDrawer)
  }, [onSave, selections, closeDrawer])

  const handleSelect = useCallback(
    (id: number | string, path: Array<{ id: number | string; title: string }>) => {
      setSelections((prev) => {
        const next = new Map(prev)

        if (next.has(id)) {
          next.delete(id)
        } else {
          if (!hasMany) {
            // Single select: clear previous selections
            next.clear()
          }
          next.set(id, { id, path })
        }

        return next
      })
    },
    [hasMany],
  )

  const handleClearAll = useCallback(() => {
    setSelections(new Map())
  }, [])

  const selectionCount = selections.size

  return (
    <div className={`${baseClass}__content`}>
      <DrawerActionHeader
        onCancel={handleCancel}
        onSave={handleSave}
        saveLabel={t('general:select')}
        title={t('general:selectValue', { label: collectionLabel })}
      />
      <div className={`${baseClass}__subheader`}>
        <div className={`${baseClass}__subheader-left`}>
          {Icon || <TagIcon />}
          <h4>{collectionLabel}</h4>
        </div>
        <div className={`${baseClass}__subheader-right`}>
          {showMoveToRoot && onMoveToRoot && (
            <button className={`${baseClass}__move-to-root`} onClick={onMoveToRoot} type="button">
              {t('hierarchy:moveToRoot')}
            </button>
          )}
          {selectionCount > 0 && (
            <>
              <span className={`${baseClass}__selection-info`}>{selectionCount} selected</span>
              <span>—</span>
              <button className={`${baseClass}__clear-all`} onClick={handleClearAll} type="button">
                {t('general:clearAll')}
              </button>
            </>
          )}
        </div>
      </div>
      <div className={`${baseClass}__columns`}>
        {isPathReady && (
          <HierarchyColumnBrowser
            ancestorsWithSelections={ancestorsWithSelections}
            collectionSlug={collectionSlug}
            disabledIds={disabledIds}
            filterByCollection={filterByCollection}
            initialExpandedPath={initialExpandedPath}
            onSelect={handleSelect}
            parentFieldName={parentFieldName}
            selectedIds={selectedIds}
            useAsTitle={useAsTitle}
          />
        )}
      </div>
    </div>
  )
}

export const HierarchyDrawer: React.FC<HierarchyDrawerInternalProps> = (props) => {
  const { drawerSlug } = props

  return (
    <Drawer className={baseClass} gutter={false} Header={null} slug={drawerSlug}>
      <HierarchyDrawerContent {...props} />
    </Drawer>
  )
}
