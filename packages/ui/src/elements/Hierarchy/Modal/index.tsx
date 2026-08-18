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

import type { HierarchyColumnBrowserRef } from '../ColumnBrowser/index.js'
import type { PathSegment } from '../ColumnBrowser/types.js'
import type { HierarchyModalInternalProps, SelectionWithPath } from './types.js'

import { useEffectEvent } from '../../../hooks/useEffectEvent.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { DialogBody, DialogHeader, DialogModal } from '../../Dialog/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'
import { DrawerDepthProvider } from '../../Drawer/index.js'
import { HierarchyColumnBrowser } from '../ColumnBrowser/index.js'
import { fetchAncestorPaths } from './fetchAncestorPath.js'
import { HierarchyModalFooter } from './Footer/index.js'
import './index.css'

export const baseClass = 'hierarchy-modal'

type HierarchyModalContentProps = {
  columnBrowserRef?: React.RefObject<HierarchyColumnBrowserRef | null>
  onCreateNew?: (params: { parentId: null | number | string }) => void
} & HierarchyModalInternalProps

export type HierarchyModalContentRef = {
  selectItem: (params: { id: number | string; title?: string }) => void
}

export const HierarchyModalContent = function HierarchyModalContent({
  baseFilter,
  closeModal,
  columnBrowserRef,
  confirmLabel,
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
  title,
  useAsTitle,
}: { ref?: React.RefObject<HierarchyModalContentRef | null> } & HierarchyModalContentProps) {
  const { i18n, t } = useTranslation()
  // NOTE: Do NOT use useModal() here - it causes re-renders when any modal state changes
  // Use closeModal prop instead which already handles closing the modal
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
  const collectionLabelSingular = collectionConfig
    ? getTranslation(collectionConfig.labels?.singular || hierarchyCollectionSlug, i18n)
    : hierarchyCollectionSlug

  const parentFieldName_internal =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy.parentFieldName
      : parentFieldName

  const [initialExpandedPath, setInitialExpandedPath] = useState<(number | string)[] | undefined>()
  const [previousPath, setPreviousPath] = useState<PathSegment[] | undefined>()
  const [isLoadingPath, setIsLoadingPath] = useState(Boolean(initialSelections?.length))
  const hasLoadedPathRef = React.useRef(false)

  const mapSelections = useCallback(
    (ids?: (number | string)[]) => {
      const map = new Map<number | string, SelectionWithPath>()

      // Single-select is a move: the existing value is the origin shown in the footer, not a
      // pre-made choice. Multi-select edits a set, so existing values start checked.
      if (ids && hasMany) {
        for (const id of ids) {
          map.set(id, { id, path: [] })
        }
      }

      return map
    },
    [hasMany],
  )

  const [selections, setSelections] = useState<Map<number | string, SelectionWithPath>>(() =>
    mapSelections(initialSelections),
  )

  const loadAncestorPaths = useEffectEvent(async (ids?: (number | string)[]) => {
    const firstId = ids?.[0]

    if (!firstId) {
      setIsLoadingPath(false)
      return
    }

    // Multi-select marks the ancestors of every checked item as partially selected, so all of
    // their paths are needed. Single-select only needs the origin of the move.
    const itemIds = hasMany ? ids : [firstId]

    try {
      const paths = await fetchAncestorPaths({
        api,
        collectionSlug: hierarchyCollectionSlug,
        itemIds,
        parentFieldName: parentFieldName_internal,
        serverURL,
        useAsTitle: useAsTitle || 'id',
      })

      const firstPath = paths.get(firstId)
      setInitialExpandedPath(firstPath?.ancestorIds)
      setPreviousPath(firstPath?.path)

      // Selections seeded from the field's value start without a path - backfill them so their
      // ancestors can be marked, and so the footer breadcrumbs read correctly
      if (hasMany) {
        setSelections((prev) => {
          const next = new Map(prev)

          for (const [id, { path }] of paths) {
            if (next.has(id)) {
              next.set(id, { id, path })
            }
          }

          return next
        })
      }
    } catch {
      // Silently handle fetch errors - will just start at root
    } finally {
      setIsLoadingPath(false)
    }
  })

  // Load ancestor paths on mount
  useEffect(() => {
    if (hasLoadedPathRef.current) {
      return
    }
    hasLoadedPathRef.current = true
    void loadAncestorPaths(initialSelections)
  }, [initialSelections])

  const selectedIds = useMemo(() => new Set(selections.keys()), [selections])

  // Every ancestor of a checked item gets a badge counting the picks below it, so a collapsed
  // branch still shows how much is selected inside
  const selectedDescendantCounts = useMemo(() => {
    const counts = new Map<number | string, number>()

    for (const { id, path } of selections.values()) {
      for (const segment of path) {
        if (segment.id !== id) {
          counts.set(segment.id, (counts.get(segment.id) ?? 0) + 1)
        }
      }
    }

    return counts
  }, [selections])

  const handleSave = useCallback(() => {
    onSave({ closeModal, selections })
  }, [onSave, selections, closeModal])

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

        // Single select replaces rather than toggles - clicking an item always makes it the
        // destination, so re-clicking the open folder cannot leave the move with no target
        if (!hasMany) {
          next.clear()
          next.set(id, { id, path })
          return next
        }

        if (next.has(id)) {
          next.delete(id)
        } else {
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

  const handleRevealPath = useCallback(
    (path: PathSegment[]) => {
      void columnBrowserRef?.current?.revealPath(path)
    },
    [columnBrowserRef],
  )

  const handleCancel = useCallback(() => {
    setSelections(mapSelections(initialSelections))
    closeModal()
  }, [closeModal, initialSelections, mapSelections])

  // Expose selectItem for programmatic selection (e.g., after creating a new item)
  useImperativeHandle(
    ref,
    () => ({
      selectItem: ({ id, title: itemTitle }: { id: number | string; title?: string }) => {
        setSelections((prev) => {
          const next = new Map(prev)
          if (!hasMany) {
            next.clear()
          }
          // A newly created item has no browsed path, so its own title is the whole breadcrumb
          next.set(id, { id, path: itemTitle ? [{ id, title: itemTitle }] : [] })
          return next
        })
      },
    }),
    [hasMany],
  )

  const selectionCount = selections.size
  const destinationPath = hasMany ? undefined : selections.values().next().value?.path

  return (
    <div className={`${baseClass}__content`}>
      <DialogHeader
        onClose={handleCancel}
        showClose
        title={title || t('general:selectLabel', { label: collectionLabel })}
      />
      <DialogBody>
        <div className={`${baseClass}__columns`}>
          <HierarchyColumnBrowser
            baseFilter={baseFilter}
            disabledIds={disabledIds}
            filterByCollection={filterByCollection}
            hasMany={hasMany}
            hierarchyCollectionSlug={hierarchyCollectionSlug}
            initialExpandedPath={initialExpandedPath}
            isLoadingPath={isLoadingPath}
            onCreateNew={onCreateNew}
            onSelect={handleSelect}
            parentFieldName={parentFieldName}
            ref={columnBrowserRef}
            selectedDescendantCounts={selectedDescendantCounts}
            selectedIds={selectedIds}
            useAsTitle={useAsTitle}
          />
        </div>
      </DialogBody>
      <HierarchyModalFooter
        confirmLabel={confirmLabel || (hasMany ? t('general:confirm') : t('general:move'))}
        destinationPath={destinationPath}
        Icon={Icon}
        isConfirmDisabled={selectionCount === 0}
        isMultiSelect={hasMany}
        onClear={handleClearAll}
        onConfirm={handleSave}
        onMoveToRoot={onMoveToRoot}
        onRevealPath={handleRevealPath}
        placeholderLabel={t('general:selectLabel', {
          label: hasMany ? collectionLabel : collectionLabelSingular,
        })}
        previousPath={hasMany ? undefined : previousPath}
        selectionCount={selectionCount}
        selectionCountLabel={t('general:selectedCount', {
          count: selectionCount,
          label: collectionLabel,
        })}
        showMoveToRoot={showMoveToRoot}
      />
    </div>
  )
}

export const HierarchyModal: React.FC<HierarchyModalInternalProps> = (props) => {
  const { hierarchyCollectionSlug, modalSlug, parentFieldName, reopenCount, useAsTitle } = props

  const { refreshTree } = useHierarchy()

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
  const modalContentRef = useRef<HierarchyModalContentRef | null>(null)

  // Key for DocumentDrawer to force remount when parentId changes
  const [documentDrawerKey, setDocumentDrawerKey] = useState(0)

  // Stable drawer slug for the document drawer - must not change on remount
  const documentDrawerSlug = `${modalSlug}-create-doc`

  // Document drawer for creating new items - rendered OUTSIDE the modal to avoid nested modal issues
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
      if (modalContentRef.current && doc?.id) {
        const newItemTitle = useAsTitle ? doc[useAsTitle] : undefined

        modalContentRef.current.selectItem({
          id: doc.id,
          title: typeof newItemTitle === 'string' ? newItemTitle : undefined,
        })
      }
      refreshTree(hierarchyCollectionSlug)
      closeDocumentDrawer()
    },
    [closeDocumentDrawer, createParentId, hierarchyCollectionSlug, refreshTree, useAsTitle],
  )

  // Memoize the content - only depends on stable values
  const modalContent = useMemo(
    () => (
      <HierarchyModalContent
        key={reopenCount}
        {...props}
        columnBrowserRef={columnBrowserRef}
        onCreateNew={handleCreateNew}
        ref={modalContentRef}
      />
    ),
    [handleCreateNew, props, reopenCount],
  )

  return (
    <>
      <DialogModal className={baseClass} closeOnBlur size="large" slug={modalSlug}>
        {modalContent}
      </DialogModal>
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
