'use client'
import { getTranslation } from '@payloadcms/translations'
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { HierarchyColumnBrowserRef } from '../../HierarchyColumnBrowser/index.js'
import type { HierarchyDrawerInternalProps, SelectionWithPath } from '../types.js'

import { useEffectEvent } from '../../../hooks/useEffectEvent.js'
import { TagIcon } from '../../../icons/Tag/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'
import { Drawer, DrawerDepthProvider } from '../../Drawer/index.js'
import { DrawerActionHeader } from '../../DrawerActionHeader/index.js'
import { HierarchyColumnBrowser } from '../../HierarchyColumnBrowser/index.js'
import { fetchAncestorPath } from '../fetchAncestorPath.js'
import './index.scss'

export const baseClass = 'hierarchy-drawer'

type HierarchyDrawerContentProps = {
  columnBrowserRef?: React.RefObject<HierarchyColumnBrowserRef | null>
  onCreateNew?: (params: { parentId: null | number | string }) => void
} & HierarchyDrawerInternalProps

export type HierarchyDrawerContentRef = {
  selectItem: (id: number | string) => void
}

export const HierarchyDrawerContent = function HierarchyDrawerContent({
  closeDrawer,
  columnBrowserRef,
  disabledIds,
  filterByCollection,
  hasMany = false,
  hierarchyCollectionSlug,
  Icon,
  initialSelections,
  onCreateNew,
  onMoveToRoot,
  onSave,
  parentFieldName,
  ref,
  showMoveToRoot,
  useAsTitle,
}: { ref?: React.RefObject<HierarchyDrawerContentRef | null> } & HierarchyDrawerContentProps) {
  const { i18n, t } = useTranslation()
  // NOTE: Do NOT use useModal() here - it causes re-renders when any modal state changes
  // Use closeDrawer prop instead which already handles closing the modal
  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: hierarchyCollectionSlug })
  const collectionLabel = collectionConfig
    ? getTranslation(collectionConfig.labels?.plural || hierarchyCollectionSlug, i18n)
    : hierarchyCollectionSlug

  const parentFieldName_internal =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy.parentFieldName
      : parentFieldName

  const [initialExpandedPath, setInitialExpandedPath] = useState<(number | string)[] | undefined>()
  const [isLoadingPath, setIsLoadingPath] = useState(Boolean(initialSelections?.length))
  const hasLoadedPathRef = React.useRef(false)
  const firstSelection = initialSelections?.[0]

  const loadAncestorPath = useEffectEvent(async (itemId?: number | string) => {
    if (!itemId) {
      setIsLoadingPath(false)
      return
    }

    try {
      const path = await fetchAncestorPath({
        api,
        collectionSlug: hierarchyCollectionSlug,
        itemId,
        parentFieldName: parentFieldName_internal,
        serverURL,
      })
      setInitialExpandedPath(path)
    } catch {
      // Silently handle fetch errors - will just start at root
    } finally {
      setIsLoadingPath(false)
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
    closeDrawer()
  }, [closeDrawer])

  const handleSave = useCallback(() => {
    onSave({ closeDrawer, selections })
  }, [onSave, selections, closeDrawer])

  const handleSelect = useCallback(
    ({
      id,
      path,
    }: {
      id: number | string
      path: Array<{ id: number | string; title: string }>
    }) => {
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

  // Expose selectItem for programmatic selection (e.g., after creating a new item)
  useImperativeHandle(
    ref,
    () => ({
      selectItem: (id: number | string) => {
        setSelections((prev) => {
          const next = new Map(prev)
          if (!hasMany) {
            next.clear()
          }
          // Path will be empty for newly created items - could be enhanced later
          next.set(id, { id, path: [] })
          return next
        })
      },
    }),
    [hasMany],
  )

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
          {Icon || <TagIcon color="muted" />}
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
        <HierarchyColumnBrowser
          ancestorsWithSelections={ancestorsWithSelections}
          disabledIds={disabledIds}
          filterByCollection={filterByCollection}
          hierarchyCollectionSlug={hierarchyCollectionSlug}
          initialExpandedPath={initialExpandedPath}
          isLoadingPath={isLoadingPath}
          onCreateNew={onCreateNew}
          onSelect={handleSelect}
          parentFieldName={parentFieldName}
          ref={columnBrowserRef}
          selectedIds={selectedIds}
          useAsTitle={useAsTitle}
        />
      </div>
    </div>
  )
}

export const HierarchyDrawer: React.FC<HierarchyDrawerInternalProps> = (props) => {
  const { drawerSlug, hierarchyCollectionSlug, parentFieldName } = props

  // Get parentFieldName from hierarchy config
  const { getEntityConfig } = useConfig()
  const collectionConfig = getEntityConfig({ collectionSlug: hierarchyCollectionSlug })
  const parentFieldName_internal =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy.parentFieldName
      : parentFieldName

  // Track which parentId is being used for the document drawer - use state to trigger re-render
  const [createParentId, setCreateParentId] = useState<null | number | string>(null)

  // Ref to access column browser's refresh function
  const columnBrowserRef = useRef<HierarchyColumnBrowserRef | null>(null)

  // Ref to access drawer content's selectItem function
  const drawerContentRef = useRef<HierarchyDrawerContentRef | null>(null)

  // Key for DocumentDrawer to force remount when parentId changes
  const [documentDrawerKey, setDocumentDrawerKey] = useState(0)

  // Stable drawer slug for the document drawer - must not change on remount
  const documentDrawerSlug = `${drawerSlug}-create-doc`

  // Document drawer for creating new items - rendered OUTSIDE the Drawer to avoid nested modal issues
  const [DocumentDrawer, , { closeDrawer: closeDocumentDrawer, openDrawer: openDocumentDrawer }] =
    useDocumentDrawer({
      collectionSlug: hierarchyCollectionSlug,
      drawerSlug: documentDrawerSlug,
    })

  const handleCreateNew = useCallback(
    ({ parentId }: { parentId: null | number | string }) => {
      // Increment key to force DocumentDrawer remount with new initialData
      setDocumentDrawerKey((prev) => prev + 1)
      setCreateParentId(parentId)
      // Use setTimeout to ensure state update triggers re-render before opening drawer
      setTimeout(() => {
        openDocumentDrawer()
      }, 0)
    },
    [openDocumentDrawer],
  )

  // Refresh the column, select the new item, and close the document drawer after creation
  const handleDocumentSave = useCallback<
    NonNullable<React.ComponentProps<typeof DocumentDrawer>['onSave']>
  >(
    ({ doc }) => {
      if (columnBrowserRef.current && createParentId !== undefined) {
        void columnBrowserRef.current.refreshColumn(createParentId)
      }
      if (drawerContentRef.current && doc?.id) {
        drawerContentRef.current.selectItem(doc.id)
      }
      closeDocumentDrawer()
    },
    [closeDocumentDrawer, createParentId],
  )

  // Memoize the content - only depends on stable values
  const drawerContent = useMemo(
    () => (
      <HierarchyDrawerContent
        {...props}
        columnBrowserRef={columnBrowserRef}
        onCreateNew={handleCreateNew}
        ref={drawerContentRef}
      />
    ),
    [handleCreateNew, props],
  )

  return (
    <>
      <Drawer className={baseClass} gutter={false} Header={null} slug={drawerSlug}>
        {drawerContent}
      </Drawer>
      <DrawerDepthProvider>
        <DocumentDrawer
          initialData={
            createParentId !== null ? { [parentFieldName_internal]: createParentId } : undefined
          }
          key={documentDrawerKey}
          onSave={handleDocumentSave}
        />
      </DrawerDepthProvider>
    </>
  )
}
