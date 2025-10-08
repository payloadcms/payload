'use client'

import type { CollectionSlug, FolderSortKeys } from 'payload'
import type { TreeViewDocument, TreeViewItemKey } from 'payload/shared'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { extractID } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { useConfig } from '../Config/index.js'
import { useLocale } from '../Locale/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import { useTranslation } from '../Translation/index.js'

type TreeViewQueryParams = {
  page?: string
  search?: string
  sort?: string
}

export type TreeViewContextValue = {
  checkIfItemIsDisabled: (item: TreeViewDocument) => boolean
  clearSelections: () => void
  ComponentToRender: React.ReactNode
  documents?: TreeViewDocument[]
  dragOverlayItem?: TreeViewDocument | undefined
  dragStartX: number
  focusedRowIndex: number
  getSelectedItems?: () => TreeViewDocument[]
  isDragging: boolean
  itemKeysToMove?: Set<TreeViewItemKey>
  moveItems: (args: { docIDs: (number | string)[]; parentID?: number | string }) => Promise<void>
  onItemClick: (args: {
    event: React.MouseEvent<HTMLElement>
    index: number
    item: TreeViewDocument
    keepSelected?: boolean
  }) => void
  onItemDrag: (args: { event: PointerEvent; item: TreeViewDocument }) => void
  onItemKeyPress: (args: {
    event: React.KeyboardEvent
    index: number
    item: TreeViewDocument
  }) => void
  parentFieldName: string
  refineTreeViewData: (args: { query?: TreeViewQueryParams; updateURL: boolean }) => void
  search: string
  readonly selectedItemKeys: Set<TreeViewItemKey>
  setDragStartX: React.Dispatch<React.SetStateAction<number>>
  setFocusedRowIndex: React.Dispatch<React.SetStateAction<number>>
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>
  sort: FolderSortKeys
}

const Context = React.createContext<TreeViewContextValue>({
  checkIfItemIsDisabled: () => false,
  clearSelections: () => {},
  ComponentToRender: null,
  documents: [],
  dragOverlayItem: undefined,
  dragStartX: 0,
  focusedRowIndex: -1,
  getSelectedItems: () => [],
  isDragging: false,
  itemKeysToMove: undefined,
  moveItems: () => Promise.resolve(undefined),
  onItemClick: () => undefined,
  onItemDrag: () => undefined,
  onItemKeyPress: () => undefined,
  parentFieldName: '_parentDoc',
  refineTreeViewData: () => undefined,
  search: '',
  selectedItemKeys: new Set<TreeViewItemKey>(),
  setDragStartX: () => 0,
  setFocusedRowIndex: () => -1,
  setIsDragging: () => false,
  sort: 'name',
})

export type TreeViewProviderProps = {
  readonly allowMultiSelection?: boolean
  /**
   * Children to render inside the provider
   */
  readonly children: React.ReactNode
  readonly collectionSlug: CollectionSlug
  /**
   * The component to render the folder results
   */
  readonly ComponentToRender: React.ReactNode
  /**
   * All documents in the tree
   */
  readonly documents: TreeViewDocument[]
  /**
   * Optional function to call when an item is clicked
   */
  readonly onItemClick?: (item: TreeViewDocument) => void
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
   *
   */
}
export function TreeViewProvider({
  allowMultiSelection = true,
  children,
  collectionSlug,
  ComponentToRender: InitialComponentToRender,
  documents,
  onItemClick: onItemClickFromProps,
  parentFieldName = '_parentDoc',
  search,
  sort = 'name',
}: TreeViewProviderProps) {
  const parentTreeViewContext = useTreeView()
  const { config } = useConfig()
  const { routes, serverURL } = config
  const { t } = useTranslation()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const locale = useLocale()
  const localeCode = locale ? locale.code : undefined

  const currentlySelectedIndexes = React.useRef(new Set<number>())

  const [ComponentToRender, setComponentToRender] = React.useState(
    InitialComponentToRender || (() => null),
  )

  const rawSearchParams = useSearchParams()
  const searchParams = React.useMemo(() => parseSearchParams(rawSearchParams), [rawSearchParams])
  const [currentQuery, setCurrentQuery] = React.useState<TreeViewQueryParams>(searchParams)

  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStartX, setDragStartX] = React.useState(0)
  const [selectedItemKeys, setSelectedItemKeys] = React.useState<Set<TreeViewItemKey>>(
    () => new Set(),
  )
  const [focusedRowIndex, setFocusedRowIndex] = React.useState(-1)
  const [isDoubleClickEnabled] = React.useState(false)
  const [dragOverlayItem, setDragOverlayItem] = React.useState<TreeViewDocument | undefined>()
  const lastClickTime = React.useRef<null | number>(null)
  const totalCount = documents.length

  const clearSelections = React.useCallback(() => {
    setFocusedRowIndex(-1)
    setSelectedItemKeys(new Set())
    setDragOverlayItem(undefined)
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
      return documents.find((doc) => doc.itemKey === itemKey)
    },
    [documents],
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
      const allItems = documents

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
    [documents, selectedItemKeys],
  )

  const updateSelections = React.useCallback(
    ({ indexes }: { indexes: number[] }) => {
      const allItems = documents
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
    [documents],
  )

  const onItemKeyPress: TreeViewContextValue['onItemKeyPress'] = React.useCallback(
    ({ event, item: currentItem }) => {
      const { code, ctrlKey, metaKey, shiftKey } = event
      const isShiftPressed = shiftKey
      const isCtrlPressed = ctrlKey || metaKey
      const isCurrentlySelected = selectedItemKeys.has(currentItem.itemKey)
      const allItems = documents
      const currentItemIndex = allItems.findIndex((item) => item.itemKey === currentItem.itemKey)

      switch (code) {
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp': {
          event.preventDefault()

          if (currentItemIndex === -1) {
            break
          }

          const isBackward = code === 'ArrowLeft' || code === 'ArrowUp'
          const newItemIndex = isBackward ? currentItemIndex - 1 : currentItemIndex + 1

          if (newItemIndex < 0 || newItemIndex > totalCount - 1) {
            // out of bounds, keep current selection
            return
          }

          setFocusedRowIndex(newItemIndex)

          if (isCtrlPressed) {
            break
          }

          if (isShiftPressed && allowMultiSelection) {
            const selectedIndexes = handleShiftSelection(newItemIndex)
            updateSelections({ indexes: selectedIndexes })
            return
          }

          // Single selection without shift
          if (!isShiftPressed) {
            const newItem = allItems[newItemIndex]
            setSelectedItemKeys(new Set([newItem.itemKey]))
          }

          break
        }
        case 'Enter': {
          if (selectedItemKeys.size === 1) {
            setFocusedRowIndex(undefined)
            navigateAfterSelection({
              collectionSlug: currentItem.relationTo,
              docID: extractID(currentItem.value),
            })
            return
          }
          break
        }
        case 'Escape': {
          clearSelections()
          break
        }
        case 'KeyA': {
          if (allowMultiSelection && isCtrlPressed) {
            event.preventDefault()
            setFocusedRowIndex(totalCount - 1)
            updateSelections({
              indexes: Array.from({ length: totalCount }, (_, i) => i),
            })
          }
          break
        }
        case 'Space': {
          if (allowMultiSelection && isShiftPressed) {
            event.preventDefault()
            updateSelections({
              indexes: allItems.reduce((acc, item, idx) => {
                if (item.itemKey === currentItem.itemKey) {
                  if (isCurrentlySelected) {
                    return acc
                  } else {
                    acc.push(idx)
                  }
                } else if (selectedItemKeys.has(item.itemKey)) {
                  acc.push(idx)
                }
                return acc
              }, []),
            })
          } else {
            event.preventDefault()
            updateSelections({
              indexes: isCurrentlySelected ? [] : [currentItemIndex],
            })
          }
          break
        }
        case 'Tab': {
          if (allowMultiSelection && isShiftPressed) {
            const prevIndex = currentItemIndex - 1
            if (prevIndex < 0 && selectedItemKeys?.size > 0) {
              setFocusedRowIndex(prevIndex)
            }
          } else {
            const nextIndex = currentItemIndex + 1
            if (nextIndex === totalCount && selectedItemKeys.size > 0) {
              setFocusedRowIndex(totalCount - 1)
            }
          }
          break
        }
      }
    },
    [
      selectedItemKeys,
      documents,
      allowMultiSelection,
      handleShiftSelection,
      updateSelections,
      navigateAfterSelection,
      clearSelections,
      totalCount,
    ],
  )

  const onItemDrag: TreeViewContextValue['onItemDrag'] = React.useCallback(
    ({ event, item: dragItem }) => {
      const isCtrlPressed = event.ctrlKey || event.metaKey
      const isShiftPressed = event.shiftKey
      const isCurrentlySelected = selectedItemKeys.has(dragItem.itemKey)
      const allItems = [...documents]

      if (!isCurrentlySelected) {
        updateSelections({
          indexes: allItems.reduce((acc, item, idx) => {
            if (item.itemKey === dragItem.itemKey) {
              acc.push(idx)
            } else if ((isCtrlPressed || isShiftPressed) && selectedItemKeys.has(item.itemKey)) {
              acc.push(idx)
            }
            return acc
          }, []),
        })

        setDragOverlayItem(getItem(dragItem.itemKey))
      }
    },
    [selectedItemKeys, documents, getItem, updateSelections],
  )

  const onItemClick: TreeViewContextValue['onItemClick'] = React.useCallback(
    ({ event, item: clickedItem, keepSelected }) => {
      let doubleClicked: boolean = false
      const isCtrlPressed = event?.ctrlKey || event?.nativeEvent?.ctrlKey || event?.metaKey
      const isShiftPressed = event?.shiftKey || event?.nativeEvent?.shiftKey
      const isCurrentlySelected = selectedItemKeys.has(clickedItem.itemKey)

      if (allowMultiSelection && (isCtrlPressed || isShiftPressed)) {
        const currentItemIndex = documents.findIndex((item) => item.itemKey === clickedItem.itemKey)
        if (isCtrlPressed) {
          const indexes = documents.reduce((acc, item, idx) => {
            if (item.itemKey === clickedItem.itemKey) {
              if (!isCurrentlySelected || keepSelected) {
                acc.push(idx)
                setDragOverlayItem(getItem(clickedItem.itemKey))
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
          setDragOverlayItem(getItem(clickedItem.itemKey))
        }
      } else {
        // Normal click - select single item
        const now = Date.now()
        doubleClicked =
          now - lastClickTime.current < 400 && dragOverlayItem?.itemKey === clickedItem.itemKey
        lastClickTime.current = now
        if (!doubleClicked || !isDoubleClickEnabled) {
          updateSelections({
            indexes: (() => {
              const indexes: number[] = []

              for (let idx = 0; idx < documents.length; idx++) {
                const item = documents[idx]
                if (clickedItem.itemKey === item.itemKey) {
                  if (keepSelected || !selectedItemKeys.has(item.itemKey)) {
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

        if (isCurrentlySelected) {
          const selectedArray = Array.from(selectedItemKeys)
          const lastSelectedKey = selectedArray[selectedArray.length - 1]
          if (lastSelectedKey) {
            setDragOverlayItem(getItem(lastSelectedKey))
          } else {
            setDragOverlayItem(undefined)
          }
        } else {
          setDragOverlayItem(getItem(clickedItem.itemKey))
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
      documents,
      allowMultiSelection,
      dragOverlayItem,
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
      } catch (error) {
        toast.error(t('general:error'))
        // eslint-disable-next-line no-console
        console.error(error)
      }

      clearSelections()
    },
    [clearSelections, routes.api, serverURL, t, localeCode, collectionSlug, parentFieldName],
  )

  const checkIfItemIsDisabled: TreeViewContextValue['checkIfItemIsDisabled'] = React.useCallback(
    (item) => {
      if (isDragging) {
        const isSelected = selectedItemKeys.has(item.itemKey)
        if (isSelected) {
          return true
        }
      } else if (parentTreeViewContext?.selectedItemKeys?.size) {
        // Disable selected items from being navigated to in move to drawer
        if (parentTreeViewContext.selectedItemKeys.has(item.itemKey)) {
          return true
        }
      }
    },
    [isDragging, selectedItemKeys, parentTreeViewContext?.selectedItemKeys],
  )

  // If a new component is provided, update the state so children can re-render with the new component
  React.useEffect(() => {
    if (InitialComponentToRender) {
      setComponentToRender(InitialComponentToRender)
    }
  }, [InitialComponentToRender])

  return (
    <Context
      value={{
        checkIfItemIsDisabled,
        clearSelections,
        ComponentToRender,
        documents,
        dragOverlayItem,
        dragStartX,
        focusedRowIndex,
        getSelectedItems,
        isDragging,
        itemKeysToMove: parentTreeViewContext.selectedItemKeys,
        moveItems,
        onItemClick,
        onItemDrag,
        onItemKeyPress,
        parentFieldName,
        refineTreeViewData,
        search,
        selectedItemKeys,
        setDragStartX,
        setFocusedRowIndex,
        setIsDragging,
        sort,
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
