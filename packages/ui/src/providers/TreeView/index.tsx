'use client'

import type { CollectionSlug, FolderSortKeys } from 'payload'
import type { TreeViewItem, TreeViewItemKey } from 'payload/shared'

import { useRouter, useSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import type { ItemKey, SectionRow } from '../../elements/TreeView/NestedSectionsTable/types.js'

import { getAllDescendantIDs } from '../../elements/TreeView/utils/getAllDescendantIDs.js'
import { itemsToSectionRows } from '../../elements/TreeView/utils/itemsToSectionRows.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { useConfig } from '../Config/index.js'
import { useLocale } from '../Locale/index.js'
import { usePreferences } from '../Preferences/index.js'
import { useRouteCache } from '../RouteCache/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import { useTranslation } from '../Translation/index.js'

type TreeViewQueryParams = {
  page?: string
  search?: string
  sort?: string
}

export type TreeViewContextValue = {
  clearSelections: () => void
  collectionSlug: CollectionSlug
  isRowFocusable: (row: SectionRow) => boolean
  loadingRowItemKeys: Set<ItemKey>
  onDrop: (params: { targetItemKey: ItemKey | null }) => Promise<void>
  onItemSelection: (args: {
    eventOptions?: {
      ctrlKey?: boolean
      metaKey?: boolean
      shiftKey?: boolean
    }
    itemKey: TreeViewItemKey
  }) => void
  openItemKeys: Set<ItemKey>
  refineTreeViewData: (args: { query?: TreeViewQueryParams; updateURL: boolean }) => void
  search: string
  sections: SectionRow[]
  selectAll: () => void
  readonly selectedItemKeys: Set<TreeViewItemKey>
  sort: FolderSortKeys
  toggleRow: (itemKey: TreeViewItemKey) => void
  updateSelections: (args: { itemKeys: Set<TreeViewItemKey> | TreeViewItemKey[] }) => void
}

const Context = React.createContext<TreeViewContextValue>({
  clearSelections: () => {},
  collectionSlug: '' as CollectionSlug,
  isRowFocusable: () => true,
  loadingRowItemKeys: new Set<ItemKey>(),
  onDrop: () => Promise.resolve(undefined),
  onItemSelection: () => undefined,
  openItemKeys: new Set<ItemKey>(),
  refineTreeViewData: () => undefined,
  search: '',
  sections: [],
  selectAll: () => undefined,
  selectedItemKeys: new Set<TreeViewItemKey>(),
  sort: 'name',
  toggleRow: () => undefined,
  updateSelections: () => undefined,
})

export type TreeViewProviderProps = {
  readonly allowMultiSelection?: boolean
  /**
   * Children to render inside the provider
   */
  readonly children: React.ReactNode
  readonly collectionSlug: CollectionSlug
  /**
   * An array of IDs that should be expanded initially
   */
  readonly expandedItemKeys?: ItemKey[]
  /**
   * All items in the tree
   */
  readonly items: TreeViewItem[]
  /**
   * The field name that holds the parent reference
   */
  readonly parentFieldName?: string
  /**
   * The intial search query
   */
  readonly search?: string
  /**
   * The sort order of the documents
   *
   * @example
   * `name` for descending
   * `-name` for ascending
   */
  readonly sort?: FolderSortKeys
}
export function TreeViewProvider({
  allowMultiSelection = true,
  children,
  collectionSlug,
  expandedItemKeys,
  items: itemsFromProps,
  parentFieldName = '_parentDoc',
  search,
  sort = 'name',
}: TreeViewProviderProps) {
  const { config } = useConfig()
  const { routes, serverURL } = config
  const { i18n, t } = useTranslation()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const locale = useLocale()
  const { clearRouteCache } = useRouteCache()
  const { setPreference } = usePreferences()

  const [items, setItems] = React.useState(itemsFromProps)
  const [selectedItemKeys, setSelectedItemKeys] = React.useState<Set<TreeViewItemKey>>(
    () => new Set(),
  )
  const [openItemKeys, setOpenItemKeys] = React.useState<Set<ItemKey>>(
    () => new Set(expandedItemKeys),
  )
  const [loadingRowItemKeys, setLoadingRowItemKeys] = React.useState<Set<ItemKey>>(() => new Set())

  const localeCode = locale ? locale.code : undefined
  const currentlySelectedIndexes = React.useRef(new Set<number>())

  const rawSearchParams = useSearchParams()
  const searchParams = React.useMemo(() => parseSearchParams(rawSearchParams), [rawSearchParams])
  const [currentQuery, setCurrentQuery] = React.useState<TreeViewQueryParams>(searchParams)

  const refineTreeViewData = React.useCallback(
    ({ query, updateURL }: { query?: TreeViewQueryParams; updateURL: boolean }) => {
      if (updateURL) {
        let page = 'page' in query ? query.page : currentQuery?.page

        if ('search' in query) {
          page = '1'
        }

        const queryParams = {
          ...currentQuery,
          ...query,
          locale: localeCode,
          page,
          search: 'search' in query ? query.search : currentQuery?.search,
          sort: 'sort' in query ? query.sort : (currentQuery?.sort ?? undefined),
        }

        startRouteTransition(() =>
          router.replace(`${qs.stringify(queryParams, { addQueryPrefix: true })}`),
        )

        setCurrentQuery(queryParams)
      }
    },
    [router, startRouteTransition, currentQuery, localeCode],
  )

  const updateSelections = React.useCallback(
    ({ itemKeys }: { itemKeys: Set<TreeViewItemKey> | TreeViewItemKey[] }) => {
      setSelectedItemKeys(new Set(itemKeys))
    },
    [],
  )

  const onItemSelection: TreeViewContextValue['onItemSelection'] = React.useCallback(
    ({ itemKey: selectionItemKey }) => {
      // Simple toggle - selection logic now handled by the table
      const isCurrentlySelected = selectedItemKeys.has(selectionItemKey)
      if (isCurrentlySelected) {
        const newItemKeys = new Set(selectedItemKeys)
        newItemKeys.delete(selectionItemKey)
        updateSelections({ itemKeys: newItemKeys })
      } else {
        updateSelections({ itemKeys: [selectionItemKey] })
      }
    },
    [selectedItemKeys, updateSelections],
  )

  const selectAll: TreeViewContextValue['selectAll'] = React.useCallback(() => {
    const allItemKeys = items.map((item) => item.itemKey)
    updateSelections({ itemKeys: allItemKeys })
  }, [items, updateSelections])

  const clearSelections = React.useCallback(() => {
    setSelectedItemKeys(new Set())
    currentlySelectedIndexes.current = new Set()
  }, [])

  const moveItems = React.useCallback(
    async (args: {
      docsToMove: { relationTo: string; value: number | string }[]
      parentID?: number | string
    }) => {
      const { docsToMove, parentID } = args
      if (!docsToMove.length) {
        return
      }

      const docIDs = docsToMove.map((d) => d.value)

      // Optimistically update local documents
      setItems((prevDocs) =>
        prevDocs.map((doc) =>
          docIDs.includes(doc.value.id)
            ? {
                ...doc,
                value: {
                  ...doc.value,
                  parentID: parentID || null,
                },
              }
            : doc,
        ),
      )

      const queryParams = qs.stringify(
        {
          depth: 0,
          limit: 0,
          locale: localeCode,
          where: {
            id: {
              in: docIDs,
            },
          },
        },
        {
          addQueryPrefix: true,
        },
      )
      try {
        await fetch(`${serverURL}${routes.api}/${collectionSlug}${queryParams}`, {
          body: JSON.stringify({ [parentFieldName]: parentID || null }),
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
          method: 'PATCH',
        })
        clearRouteCache()
      } catch (error) {
        // Revert optimistic update on error
        setItems(itemsFromProps)
        toast.error(t('general:error'))
        // eslint-disable-next-line no-console
        console.error(error)
      }

      clearSelections()
    },
    [
      clearSelections,
      routes.api,
      serverURL,
      t,
      localeCode,
      collectionSlug,
      parentFieldName,
      itemsFromProps,
      clearRouteCache,
    ],
  )

  const toggleRow: TreeViewContextValue['toggleRow'] = React.useCallback(
    (itemKey) => {
      const updatedOpenItemKeys = new Set(openItemKeys)

      if (updatedOpenItemKeys.has(itemKey)) {
        // When closing a parent, also close all its descendants
        updatedOpenItemKeys.delete(itemKey)

        // Find all descendant IDs and remove them from the open set
        const descendantItemKeys = new Set<TreeViewItemKey>()
        const collectDescendants = (parentItemKey: TreeViewItemKey) => {
          items.forEach((item) => {
            if (item.parentItemKey === parentItemKey) {
              descendantItemKeys.add(item.itemKey)
              collectDescendants(item.itemKey)
            }
          })
        }
        collectDescendants(itemKey)

        descendantItemKeys.forEach((id) => {
          updatedOpenItemKeys.delete(id)
        })

        // Remove descendant items from the items array
        setItems((prevItems) => prevItems.filter((item) => !descendantItemKeys.has(item.itemKey)))

        // Also deselect all descendant items
        setSelectedItemKeys((prevSelectedKeys) => {
          const newSelectedKeys = new Set(prevSelectedKeys)
          descendantItemKeys.forEach((descendantItemKey) => {
            // Find the item key for this ID
            const item = items.find((i) => i.itemKey === descendantItemKey)
            if (item) {
              newSelectedKeys.delete(item.itemKey)
            }
          })
          return newSelectedKeys
        })
      } else {
        updatedOpenItemKeys.add(itemKey)
        setLoadingRowItemKeys((prev) => new Set(prev).add(itemKey))
      }

      setOpenItemKeys(updatedOpenItemKeys)

      void setPreference(`collection-${collectionSlug}-treeView`, {
        expandedIDs: items
          .filter((item) => updatedOpenItemKeys.has(item.itemKey))
          .map((item) => item.value.id),
      })
      clearRouteCache()
    },
    [collectionSlug, openItemKeys, items, setPreference, clearRouteCache],
  )

  const getSelectedItems = React.useCallback(() => {
    return Array.from(selectedItemKeys).reduce((acc, itemKey) => {
      const item = items.find((doc) => doc.itemKey === itemKey)
      if (item) {
        acc.push(item)
      }
      return acc
    }, [])
  }, [selectedItemKeys, items])

  const onDrop: TreeViewContextValue['onDrop'] = React.useCallback(
    async (params: { targetItemKey: ItemKey | null }) => {
      const selectedItems = getSelectedItems()
      const { docsToMove, itemKeys } = selectedItems.reduce(
        (acc, doc) => {
          acc.itemKeys.add(doc.itemKey)
          acc.docsToMove.push({
            relationTo: doc.relationTo,
            value: doc.value.id,
          })
          return acc
        },
        { docsToMove: [], itemKeys: new Set<ItemKey>() },
      )
      const targetItemKey = params.targetItemKey
      const targetItem = items.find((item) => item.itemKey === targetItemKey)

      // Validate: prevent moving a parent into its own descendant
      const invalidTargets = new Set<ItemKey>()
      itemKeys.forEach((itemKey) => {
        const descendants = getAllDescendantIDs({ itemKeys: new Set([itemKey]), items })
        descendants.forEach((descendantID) => invalidTargets.add(descendantID))
      })
      if (targetItemKey && invalidTargets.has(targetItemKey)) {
        toast.error(t('general:cannotMoveParentIntoChild'))
        return
      }

      try {
        await moveItems({
          docsToMove,
          parentID: targetItem ? targetItem.value.id : null,
        })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error moving items:', error)
        toast.error(t('general:errorMovingItems'))
      }
    },
    [moveItems, getSelectedItems, items, t],
  )

  const isRowFocusable = React.useCallback(
    (row: SectionRow) => {
      const unfocusableIDs = getAllDescendantIDs({ itemKeys: selectedItemKeys, items })
      return !unfocusableIDs.has(row.rowID)
    },
    [selectedItemKeys, items],
  )

  const sections: TreeViewContextValue['sections'] = React.useMemo(
    () => itemsToSectionRows({ i18nLanguage: i18n.language, items }),
    [items, i18n.language],
  )

  // Sync documents when prop changes and clear loading state
  React.useEffect(() => {
    setItems(itemsFromProps)
    // Clear loading state since new data has arrived
    setLoadingRowItemKeys(new Set())
  }, [itemsFromProps])

  // If a new component is provided, update the state so children can re-render with the new component
  // React.useEffect(() => {
  //   if (InitialTableComponent) {
  //     setTableComponentToRender(InitialTableComponent)
  //   }
  // }, [InitialTableComponent])

  return (
    <Context
      value={{
        clearSelections,
        collectionSlug,
        isRowFocusable,
        loadingRowItemKeys,
        onDrop,
        onItemSelection,
        openItemKeys,
        refineTreeViewData,
        search,
        sections,
        selectAll,
        selectedItemKeys,
        sort,
        // TableComponent,
        toggleRow,
        updateSelections,
      }}
    >
      {children}
    </Context>
  )
}

export function useTreeView(): TreeViewContextValue {
  const context = React.use(Context)

  if (context === undefined) {
    throw new Error('useTreeView must be used within a TreeViewProvider')
  }

  return context
}
