'use client'

import type { CollectionSlug, FolderSortKeys } from 'payload'
import type { TreeViewItem, TreeViewItemKey } from 'payload/shared'

import { useRouter, useSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import type { ItemKey } from '../../elements/TreeView/NestedSectionsTable/types.js'

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
  checkIfItemIsDisabled: (item: TreeViewItem) => boolean
  clearSelections: () => void
  collectionSlug: CollectionSlug
  getSelectedItems?: () => TreeViewItem[]
  itemKeysToMove?: Set<TreeViewItemKey>
  items?: TreeViewItem[]
  loadingRowIDs: Set<number | string>
  moveItems: (args: {
    docsToMove: { relationTo: string; value: number | string }[]
    parentID?: number | string
  }) => Promise<void>
  onItemSelection: (args: {
    eventOptions?: {
      ctrlKey?: boolean
      metaKey?: boolean
      shiftKey?: boolean
    }
    item: TreeViewItem
  }) => void
  openItemKeys: Set<ItemKey>
  parentFieldName: string
  refineTreeViewData: (args: { query?: TreeViewQueryParams; updateURL: boolean }) => void
  search: string
  selectAll: () => void
  readonly selectedItemKeys: Set<TreeViewItemKey>
  sort: FolderSortKeys
  TableComponent: React.ReactNode
  toggleRow: (itemKey: TreeViewItemKey) => void
  updateSelections: (args: { itemKeys: Set<TreeViewItemKey> | TreeViewItemKey[] }) => void
}

const Context = React.createContext<TreeViewContextValue>({
  checkIfItemIsDisabled: () => false,
  clearSelections: () => {},
  collectionSlug: '' as CollectionSlug,
  getSelectedItems: () => [],
  itemKeysToMove: undefined,
  items: [],
  loadingRowIDs: new Set<number | string>(),
  moveItems: () => Promise.resolve(undefined),
  onItemSelection: () => undefined,
  openItemKeys: new Set<ItemKey>(),
  parentFieldName: '_parentDoc',
  refineTreeViewData: () => undefined,
  search: '',
  selectAll: () => undefined,
  selectedItemKeys: new Set<TreeViewItemKey>(),
  sort: 'name',
  TableComponent: null,
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
  /**
   * The component to render the folder results
   */
  readonly TableComponent: React.ReactNode
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
  TableComponent: InitialTableComponent,
}: TreeViewProviderProps) {
  const parentTreeViewContext = useTreeView()
  const { config } = useConfig()
  const { routes, serverURL } = config
  const { t } = useTranslation()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const locale = useLocale()
  const localeCode = locale ? locale.code : undefined
  const { setPreference } = usePreferences()

  const currentlySelectedIndexes = React.useRef(new Set<number>())

  const [items, setItems] = React.useState(itemsFromProps)
  const [openItemKeys, setOpenItemKeys] = React.useState<Set<ItemKey>>(
    () => new Set(expandedItemKeys),
  )
  const [loadingRowIDs, setLoadingRowIDs] = React.useState<Set<number | string>>(() => new Set())
  const [TableComponent, setTableComponentToRender] = React.useState(
    InitialTableComponent || (() => null),
  )

  const rawSearchParams = useSearchParams()
  const searchParams = React.useMemo(() => parseSearchParams(rawSearchParams), [rawSearchParams])
  const [currentQuery, setCurrentQuery] = React.useState<TreeViewQueryParams>(searchParams)

  const [selectedItemKeys, setSelectedItemKeys] = React.useState<Set<TreeViewItemKey>>(
    () => new Set(),
  )
  const { clearRouteCache } = useRouteCache()

  const clearSelections = React.useCallback(() => {
    setSelectedItemKeys(new Set())
    currentlySelectedIndexes.current = new Set()
  }, [])

  const mergeQuery = React.useCallback(
    (newQuery: Partial<TreeViewQueryParams> = {}): Partial<TreeViewQueryParams> => {
      let page = 'page' in newQuery ? newQuery.page : currentQuery?.page

      if ('search' in newQuery) {
        page = '1'
      }

      const mergedQuery = {
        ...currentQuery,
        ...newQuery,
        locale: localeCode,
        page,
        search: 'search' in newQuery ? newQuery.search : currentQuery?.search,
        sort: 'sort' in newQuery ? newQuery.sort : (currentQuery?.sort ?? undefined),
      }

      return mergedQuery
    },
    [currentQuery, localeCode],
  )

  const refineTreeViewData: TreeViewContextValue['refineTreeViewData'] = React.useCallback(
    ({ query, updateURL }) => {
      if (updateURL) {
        const queryParams = mergeQuery(query)

        startRouteTransition(() =>
          router.replace(`${qs.stringify(queryParams, { addQueryPrefix: true })}`),
        )

        setCurrentQuery(queryParams)
      }
    },
    [mergeQuery, router, startRouteTransition],
  )

  const getItem = React.useCallback(
    (itemKey: TreeViewItemKey) => {
      return items.find((doc) => doc.itemKey === itemKey)
    },
    [items],
  )

  const getSelectedItems = React.useCallback(() => {
    return Array.from(selectedItemKeys).reduce((acc, itemKey) => {
      const item = getItem(itemKey)
      if (item) {
        acc.push(item)
      }
      return acc
    }, [])
  }, [selectedItemKeys, getItem])

  const updateSelections = React.useCallback(
    ({ itemKeys }: { itemKeys: Set<TreeViewItemKey> | TreeViewItemKey[] }) => {
      setSelectedItemKeys(new Set(itemKeys))
    },
    [],
  )

  const selectAll: TreeViewContextValue['selectAll'] = React.useCallback(() => {
    const allItemKeys = items.map((item) => item.itemKey)
    updateSelections({ itemKeys: allItemKeys })
  }, [items, updateSelections])

  const onItemSelection: TreeViewContextValue['onItemSelection'] = React.useCallback(
    ({ item: clickedItem }) => {
      // Simple toggle - selection logic now handled by the table
      const isCurrentlySelected = selectedItemKeys.has(clickedItem.itemKey)
      if (isCurrentlySelected) {
        const newItemKeys = new Set(selectedItemKeys)
        newItemKeys.delete(clickedItem.itemKey)
        updateSelections({ itemKeys: newItemKeys })
      } else {
        updateSelections({ itemKeys: [clickedItem.itemKey] })
      }
    },
    [selectedItemKeys, updateSelections],
  )

  const moveItems: TreeViewContextValue['moveItems'] = React.useCallback(
    async (args) => {
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
        setLoadingRowIDs((prev) => new Set(prev).add(itemKey))
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

  const checkIfItemIsDisabled: TreeViewContextValue['checkIfItemIsDisabled'] = React.useCallback(
    (item) => {
      if (parentTreeViewContext?.selectedItemKeys?.size) {
        // Disable selected items from being navigated to in move to drawer
        if (parentTreeViewContext.selectedItemKeys.has(item.itemKey)) {
          return true
        }
      }
    },
    [parentTreeViewContext?.selectedItemKeys],
  )

  // Sync documents when prop changes and clear loading state
  React.useEffect(() => {
    setItems(itemsFromProps)
    // Clear loading state since new data has arrived
    setLoadingRowIDs(new Set())
  }, [itemsFromProps])

  // If a new component is provided, update the state so children can re-render with the new component
  React.useEffect(() => {
    if (InitialTableComponent) {
      setTableComponentToRender(InitialTableComponent)
    }
  }, [InitialTableComponent])

  return (
    <Context
      value={{
        checkIfItemIsDisabled,
        clearSelections,
        collectionSlug,
        getSelectedItems,
        itemKeysToMove: parentTreeViewContext.selectedItemKeys,
        items,
        loadingRowIDs,
        moveItems,
        onItemSelection,
        openItemKeys,
        parentFieldName,
        refineTreeViewData,
        search,
        selectAll,
        selectedItemKeys,
        sort,
        TableComponent,
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
