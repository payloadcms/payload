'use client'

import type { CollectionSlug, FolderSortKeys } from 'payload'
import type { TreeViewItem, TreeViewItemKey } from 'payload/shared'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { extractID } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

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
  focusedRowIndex: number
  getSelectedItems?: () => TreeViewItem[]
  itemKeysToMove?: Set<TreeViewItemKey>
  items?: TreeViewItem[]
  loadingRowIDs: Set<number | string>
  moveItems: (args: { docIDs: (number | string)[]; parentID?: number | string }) => Promise<void>
  onItemClick: (args: {
    event: React.MouseEvent<HTMLElement>
    index: number
    item: TreeViewItem
  }) => void
  openItemIDs: Set<number | string>
  parentFieldName: string
  refineTreeViewData: (args: { query?: TreeViewQueryParams; updateURL: boolean }) => void
  search: string
  readonly selectedItemKeys: Set<TreeViewItemKey>
  setFocusedRowIndex: React.Dispatch<React.SetStateAction<number>>
  sort: FolderSortKeys
  TableComponent: React.ReactNode
  toggleRow: (docID: number | string) => void
}

const Context = React.createContext<TreeViewContextValue>({
  checkIfItemIsDisabled: () => false,
  clearSelections: () => {},
  collectionSlug: '' as CollectionSlug,
  focusedRowIndex: -1,
  getSelectedItems: () => [],
  itemKeysToMove: undefined,
  items: [],
  loadingRowIDs: new Set<number | string>(),
  moveItems: () => Promise.resolve(undefined),
  onItemClick: () => undefined,
  openItemIDs: new Set<number | string>(),
  parentFieldName: '_parentDoc',
  refineTreeViewData: () => undefined,
  search: '',
  selectedItemKeys: new Set<TreeViewItemKey>(),
  setFocusedRowIndex: () => -1,
  sort: 'name',
  TableComponent: null,
  toggleRow: () => undefined,
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
  readonly expandedItemIDs?: (number | string)[]
  /**
   * All items in the tree
   */
  readonly items: TreeViewItem[]
  /**
   * Optional function to call when an item is clicked
   */
  readonly onItemClick?: (item: TreeViewItem) => void
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
  expandedItemIDs,
  items: itemsFromProps,
  onItemClick: onItemClickFromProps,
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
  const [openItemIDs, setOpenItemIDs] = React.useState<Set<number | string>>(
    () => new Set(expandedItemIDs || []),
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
  const [focusedRowIndex, setFocusedRowIndex] = React.useState(-1)
  const [isDoubleClickEnabled] = React.useState(false)
  const lastClickTime = React.useRef<null | number>(null)
  const { clearRouteCache } = useRouteCache()

  const clearSelections = React.useCallback(() => {
    setFocusedRowIndex(-1)
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

  const navigateAfterSelection = React.useCallback(
    ({ collectionSlug, docID }: { collectionSlug: string; docID?: number | string }) => {
      clearSelections()
      if (typeof onItemClickFromProps === 'function') {
        onItemClickFromProps(getItem(`${collectionSlug}-${docID}`))
      }
    },
    [clearSelections, getItem, onItemClickFromProps],
  )

  const handleShiftSelection = React.useCallback(
    (targetIndex: number) => {
      const allItems = items

      // Find existing selection boundaries
      const existingIndexes = allItems.reduce((acc, item, idx) => {
        if (selectedItemKeys.has(item.itemKey)) {
          acc.push(idx)
        }
        return acc
      }, [])

      if (existingIndexes.length === 0) {
        // No existing selection, just select target
        return [targetIndex]
      }

      const firstSelectedIndex = Math.min(...existingIndexes)
      const lastSelectedIndex = Math.max(...existingIndexes)
      const isWithinBounds = targetIndex >= firstSelectedIndex && targetIndex <= lastSelectedIndex

      // Choose anchor based on whether we're contracting or extending
      let anchorIndex = targetIndex
      if (isWithinBounds) {
        // Contracting: if target is at a boundary, use target as anchor
        // Otherwise, use furthest boundary to maintain opposite edge
        if (targetIndex === firstSelectedIndex || targetIndex === lastSelectedIndex) {
          anchorIndex = targetIndex
        } else {
          const distanceToFirst = Math.abs(targetIndex - firstSelectedIndex)
          const distanceToLast = Math.abs(targetIndex - lastSelectedIndex)
          anchorIndex = distanceToFirst >= distanceToLast ? firstSelectedIndex : lastSelectedIndex
        }
      } else {
        // Extending: use closest boundary
        const distanceToFirst = Math.abs(targetIndex - firstSelectedIndex)
        const distanceToLast = Math.abs(targetIndex - lastSelectedIndex)
        anchorIndex = distanceToFirst <= distanceToLast ? firstSelectedIndex : lastSelectedIndex
      }

      // Create range from anchor to target
      const startIndex = Math.min(anchorIndex, targetIndex)
      const endIndex = Math.max(anchorIndex, targetIndex)
      const newRangeIndexes = Array.from(
        { length: endIndex - startIndex + 1 },
        (_, i) => startIndex + i,
      )

      if (isWithinBounds) {
        // Contracting: replace with new range
        return newRangeIndexes
      } else {
        // Extending: union with existing
        return [...new Set([...existingIndexes, ...newRangeIndexes])]
      }
    },
    [items, selectedItemKeys],
  )

  const updateSelections = React.useCallback(
    ({ indexes }: { indexes: number[] }) => {
      const allItems = items
      const { newSelectedItemKeys } = allItems.reduce(
        (acc, item, index) => {
          if (indexes.includes(index)) {
            acc.newSelectedItemKeys.add(item.itemKey)
          }
          return acc
        },
        {
          newSelectedItemKeys: new Set<TreeViewItemKey>(),
        },
      )

      setSelectedItemKeys(newSelectedItemKeys)
    },
    [items],
  )

  const onItemClick: TreeViewContextValue['onItemClick'] = React.useCallback(
    ({ event, item: clickedItem }) => {
      let doubleClicked: boolean = false
      const isCtrlPressed = event?.ctrlKey || event?.nativeEvent?.ctrlKey || event?.metaKey
      const isShiftPressed = event?.shiftKey || event?.nativeEvent?.shiftKey
      const isCurrentlySelected = selectedItemKeys.has(clickedItem.itemKey)

      if (allowMultiSelection && (isCtrlPressed || isShiftPressed)) {
        const currentItemIndex = items.findIndex((item) => item.itemKey === clickedItem.itemKey)
        if (isCtrlPressed) {
          const indexes = items.reduce((acc, item, idx) => {
            if (item.itemKey === clickedItem.itemKey) {
              if (!isCurrentlySelected) {
                acc.push(idx)
              }
            } else if (selectedItemKeys.has(item.itemKey)) {
              acc.push(idx)
            }
            return acc
          }, [])

          updateSelections({ indexes })
        } else if (currentItemIndex !== -1) {
          const selectedIndexes = handleShiftSelection(currentItemIndex)
          updateSelections({ indexes: selectedIndexes })
        }
      } else {
        // Normal click - select single item
        const now = Date.now()
        const lastSelectedKey = Array.from(selectedItemKeys)[selectedItemKeys.size - 1]
        const lastSelectedItem = lastSelectedKey ? getItem(lastSelectedKey) : undefined
        doubleClicked =
          now - lastClickTime.current < 400 && lastSelectedItem?.itemKey === clickedItem.itemKey
        lastClickTime.current = now
        if (!doubleClicked || !isDoubleClickEnabled) {
          updateSelections({
            indexes: (() => {
              const indexes: number[] = []

              for (let idx = 0; idx < items.length; idx++) {
                const item = items[idx]
                if (clickedItem.itemKey === item.itemKey) {
                  if (!selectedItemKeys.has(item.itemKey)) {
                    indexes.push(idx)
                  }
                } else if (selectedItemKeys.has(item.itemKey)) {
                  indexes.push(idx)
                }
              }

              return indexes
            })(),
          })
        }

        if (isDoubleClickEnabled && doubleClicked) {
          navigateAfterSelection({
            collectionSlug: clickedItem.relationTo,
            docID: extractID(clickedItem.value),
          })
        }
      }
    },
    [
      isDoubleClickEnabled,
      navigateAfterSelection,
      selectedItemKeys,
      items,
      allowMultiSelection,
      getItem,
      updateSelections,
      handleShiftSelection,
    ],
  )

  const moveItems: TreeViewContextValue['moveItems'] = React.useCallback(
    async (args) => {
      const { docIDs, parentID } = args
      if (!docIDs.length) {
        return
      }

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
    (docID) => {
      const updatedOpenDocIDs = new Set(openItemIDs)

      if (updatedOpenDocIDs.has(docID)) {
        // When closing a parent, also close all its descendants
        updatedOpenDocIDs.delete(docID)

        // Find all descendant IDs and remove them from the open set
        const descendantIDs = new Set<number | string>()
        const collectDescendants = (parentID: number | string) => {
          items.forEach((item) => {
            if (item.value.parentID === parentID) {
              descendantIDs.add(item.value.id)
              collectDescendants(item.value.id)
            }
          })
        }
        collectDescendants(docID)

        descendantIDs.forEach((id) => {
          updatedOpenDocIDs.delete(id)
        })

        // Remove descendant items from the items array
        setItems((prevItems) => prevItems.filter((item) => !descendantIDs.has(item.value.id)))

        // Also deselect all descendant items
        setSelectedItemKeys((prevSelectedKeys) => {
          const newSelectedKeys = new Set(prevSelectedKeys)
          descendantIDs.forEach((id) => {
            // Find the item key for this ID
            const item = items.find((i) => i.value.id === id)
            if (item) {
              newSelectedKeys.delete(item.itemKey)
            }
          })
          return newSelectedKeys
        })
      } else {
        updatedOpenDocIDs.add(docID)

        // Add to loading state when opening
        setLoadingRowIDs((prev) => new Set(prev).add(docID))
      }

      setOpenItemIDs(updatedOpenDocIDs)

      void setPreference(`collection-${collectionSlug}-treeView`, {
        expandedIDs: Array.from(updatedOpenDocIDs),
      })
      clearRouteCache()
    },
    [collectionSlug, openItemIDs, items, setPreference, clearRouteCache],
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

  React.useEffect(
    () => () => {
      setLoadingRowIDs(new Set())
    },
    [],
  )

  return (
    <Context
      value={{
        checkIfItemIsDisabled,
        clearSelections,
        collectionSlug,
        focusedRowIndex,
        getSelectedItems,
        itemKeysToMove: parentTreeViewContext.selectedItemKeys,
        items,
        loadingRowIDs,
        moveItems,
        onItemClick,
        openItemIDs,
        parentFieldName,
        refineTreeViewData,
        search,
        selectedItemKeys,
        setFocusedRowIndex,
        sort,
        TableComponent,
        toggleRow,
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
