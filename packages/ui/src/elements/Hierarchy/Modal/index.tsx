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
import { fetchAncestorPath } from './fetchAncestorPath.js'
import { HierarchyModalFooter } from './Footer/index.js'
import { createHierarchySelections, selectHierarchyItem } from './selection.js'
import './index.css'

export const baseClass = 'hierarchy-modal'

type HierarchyModalContentProps = {
  columnBrowserRef?: React.RefObject<HierarchyColumnBrowserRef | null>
  onCreateNew?: (params: { parentId: null | number | string; path: PathSegment[] }) => void
} & HierarchyModalInternalProps

export type HierarchyModalContentRef = {
  selectItem: (selection: SelectionWithPath) => void
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
  isBusy,
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
  const [hasSelectedDestination, setHasSelectedDestination] = useState(false)
  const hasLoadedPathRef = React.useRef(false)
  const firstSelection = initialSelections?.[0]

  const loadAncestorPath = useEffectEvent(async (itemId?: number | string) => {
    if (itemId === undefined || itemId === null) {
      setIsLoadingPath(false)
      return
    }

    try {
      const { ancestorIds, path } = await fetchAncestorPath({
        api,
        collectionSlug: hierarchyCollectionSlug,
        itemId,
        parentFieldName: parentFieldName_internal,
        serverURL,
        useAsTitle: useAsTitle || 'id',
      })
      setInitialExpandedPath(ancestorIds)
      setPreviousPath(path)
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

  const [selections, setSelections] = useState<Map<number | string, SelectionWithPath>>(() =>
    createHierarchySelections({ hasMany, initialSelections }),
  )

  const selectedIds = useMemo(() => new Set(selections.keys()), [selections])

  // For now, ancestorsWithSelections is empty - will be computed when we have path tracking
  const ancestorsWithSelections = useMemo(() => new Set<number | string>(), [])

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
      setHasSelectedDestination(true)
      setSelections((prev) => {
        return selectHierarchyItem({ id, current: prev, hasMany, path })
      })
    },
    [hasMany],
  )

  const handleClearAll = useCallback(() => {
    setSelections(new Map())
  }, [])

  const handleCancel = useCallback(() => {
    setSelections(createHierarchySelections({ hasMany, initialSelections }))
    setHasSelectedDestination(false)
    closeModal()
  }, [closeModal, hasMany, initialSelections])

  // Expose selectItem for programmatic selection (e.g., after creating a new item)
  useImperativeHandle(
    ref,
    () => ({
      selectItem: ({ id, path }: SelectionWithPath) => {
        setHasSelectedDestination(true)
        setSelections((prev) => {
          const next = new Map(prev)
          if (!hasMany) {
            next.clear()
          }
          next.set(id, { id, path })
          return next
        })
      },
    }),
    [hasMany],
  )

  const selectionCount = selections.size
  const destination =
    hasMany || !hasSelectedDestination ? undefined : selections.values().next().value
  const destinationPath = destination?.path
  const isDestinationUnchanged = destination !== undefined && destination.id === firstSelection

  return (
    <div className={`${baseClass}__content`}>
      <DialogHeader
        onClose={handleCancel}
        showClose
        title={title || t('general:selectValue', { label: collectionLabel })}
      />
      <DialogBody>
        <div className={`${baseClass}__columns`}>
          <HierarchyColumnBrowser
            ancestorsWithSelections={ancestorsWithSelections}
            baseFilter={baseFilter}
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
      </DialogBody>
      <HierarchyModalFooter
        confirmLabel={confirmLabel || t('general:confirm')}
        destinationPath={destinationPath}
        Icon={Icon}
        isBusy={isBusy}
        isConfirmDisabled={
          !hasMany && (!hasSelectedDestination || selectionCount === 0 || isDestinationUnchanged)
        }
        isMultiSelect={hasMany}
        onClear={handleClearAll}
        onConfirm={handleSave}
        onMoveToRoot={onMoveToRoot}
        placeholderLabel={t('general:selectLabel', { label: collectionLabelSingular })}
        previousPath={hasMany ? undefined : previousPath}
        selectionCount={selectionCount}
        selectionCountLabel={t('general:selectedCount', {
          count: selectionCount,
          label: selectionCount === 1 ? collectionLabelSingular : collectionLabel,
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
  const [createParentPath, setCreateParentPath] = useState<PathSegment[]>([])

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
    ({ parentId, path = [] }: { parentId: null | number | string; path?: PathSegment[] }) => {
      // Increment key to force DocumentDrawer remount with new initialData
      setDocumentDrawerKey((prev) => prev + 1)
      setCreateParentId(parentId)
      setCreateParentPath(path)
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
        const title = useAsTitle ? doc[useAsTitle] : undefined

        modalContentRef.current.selectItem({
          id: doc.id,
          path: [
            ...createParentPath,
            {
              id: doc.id,
              title:
                typeof title === 'number' || typeof title === 'string'
                  ? String(title)
                  : String(doc.id),
            },
          ],
        })
      }
      refreshTree(hierarchyCollectionSlug)
      closeDocumentDrawer()
    },
    [
      closeDocumentDrawer,
      createParentId,
      createParentPath,
      hierarchyCollectionSlug,
      refreshTree,
      useAsTitle,
    ],
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
