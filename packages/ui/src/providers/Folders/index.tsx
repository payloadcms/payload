'use client'

import type { ClientCollectionConfig, CollectionSlug, FolderSortKeys } from 'payload'
import type { FolderBreadcrumb, FolderDocumentItemKey, FolderOrDocument } from 'payload/shared'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { extractID, formatAdminURL, formatFolderOrDocumentItem } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import { useDrawerDepth } from '../../elements/Drawer/index.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { useConfig } from '../Config/index.js'
import { useLocale } from '../Locale/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import { useTranslation } from '../Translation/index.js'
import { groupItemIDsByRelation } from './groupItemIDsByRelation.js'

type FolderQueryParams = {
  page?: string
  relationTo?: CollectionSlug[]
  search?: string
  sort?: string
}

export type FileCardData = {
  filename: string
  id: number | string
  mimeType: string
  name: string
  url: string
}

export type FolderContextValue = {
  /**
   * The collection slugs that a view can be filtered by
   * Used in the browse-by-folder view
   */
  activeCollectionFolderSlugs: CollectionSlug[]
  /**
   * Folder enabled collection slugs that can be populated within the provider
   */
  readonly allCollectionFolderSlugs?: CollectionSlug[]
  allowCreateCollectionSlugs: CollectionSlug[]
  breadcrumbs?: FolderBreadcrumb[]
  checkIfItemIsDisabled: (item: FolderOrDocument) => boolean
  clearSelections: () => void
  currentFolder?: FolderOrDocument | null
  documents?: FolderOrDocument[]
  dragOverlayItem?: FolderOrDocument | undefined
  focusedRowIndex: number
  folderCollectionConfig: ClientCollectionConfig
  folderCollectionSlug: string
  folderFieldName: string
  folderID?: number | string
  FolderResultsComponent: React.ReactNode
  folderType: CollectionSlug[] | undefined
  getFolderRoute: (toFolderID?: number | string) => string
  getSelectedItems?: () => FolderOrDocument[]
  isDragging: boolean
  itemKeysToMove?: Set<FolderDocumentItemKey>
  moveToFolder: (args: {
    itemsToMove: FolderOrDocument[]
    toFolderID?: number | string
  }) => Promise<void>
  onItemClick: (args: { event: React.MouseEvent; index: number; item: FolderOrDocument }) => void
  onItemKeyPress: (args: {
    event: React.KeyboardEvent
    index: number
    item: FolderOrDocument
  }) => void
  refineFolderData: (args: { query?: FolderQueryParams; updateURL: boolean }) => void
  search: string
  selectedFolderCollections?: CollectionSlug[]
  readonly selectedItemKeys: Set<FolderDocumentItemKey>
  setBreadcrumbs: React.Dispatch<React.SetStateAction<FolderBreadcrumb[]>>
  setFocusedRowIndex: React.Dispatch<React.SetStateAction<number>>
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>
  sort: FolderSortKeys
  subfolders?: FolderOrDocument[]
}

const Context = React.createContext<FolderContextValue>({
  activeCollectionFolderSlugs: [],
  allCollectionFolderSlugs: [],
  allowCreateCollectionSlugs: [],
  breadcrumbs: [],
  checkIfItemIsDisabled: () => false,
  clearSelections: () => {},
  currentFolder: null,
  documents: [],
  dragOverlayItem: undefined,
  focusedRowIndex: -1,
  folderCollectionConfig: null,
  folderCollectionSlug: '',
  folderFieldName: 'folder',
  folderID: undefined,
  FolderResultsComponent: null,
  folderType: undefined,
  getFolderRoute: () => '',
  getSelectedItems: () => [],
  isDragging: false,
  itemKeysToMove: undefined,
  moveToFolder: () => Promise.resolve(undefined),
  onItemClick: () => undefined,
  onItemKeyPress: () => undefined,
  refineFolderData: () => undefined,
  search: '',
  selectedFolderCollections: undefined,
  selectedItemKeys: new Set<FolderDocumentItemKey>(),
  setBreadcrumbs: () => {},
  setFocusedRowIndex: () => -1,
  setIsDragging: () => false,
  sort: 'name',
  subfolders: [],
})

export type FolderProviderProps = {
  /**
   * The collection slugs that are being viewed
   */
  readonly activeCollectionFolderSlugs?: CollectionSlug[]
  /**
   * Folder enabled collection slugs that can be populated within the provider
   */
  readonly allCollectionFolderSlugs: CollectionSlug[]
  /**
   * Array of slugs that can be created in the folder view
   */
  readonly allowCreateCollectionSlugs: CollectionSlug[]
  readonly allowMultiSelection?: boolean
  /**
   * The base folder route path
   *
   * @example
   * `/collections/:collectionSlug/:folderCollectionSlug`
   * or
   * `/browse-by-folder`
   */
  readonly baseFolderPath?: `/${string}`
  /**
   * Breadcrumbs for the current folder
   */
  readonly breadcrumbs?: FolderBreadcrumb[]
  /**
   * Children to render inside the provider
   */
  readonly children: React.ReactNode
  /**
   * All documents in the current folder
   */
  readonly documents: FolderOrDocument[]
  /**
   * The name of the field that contains the folder relation
   */
  readonly folderFieldName: string
  /**
   * The ID of the current folder
   */
  readonly folderID?: number | string
  /**
   * The component to render the folder results
   */
  readonly FolderResultsComponent: React.ReactNode
  /**
   * Optional function to call when an item is clicked
   */
  readonly onItemClick?: (itme: FolderOrDocument) => void
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
   * All subfolders in the current folder
   */
  readonly subfolders: FolderOrDocument[]
}
export function FolderProvider({
  activeCollectionFolderSlugs: activeCollectionSlugs,
  allCollectionFolderSlugs = [],
  allowCreateCollectionSlugs,
  allowMultiSelection = true,
  baseFolderPath,
  breadcrumbs: _breadcrumbsFromProps = [],
  children,
  documents,
  folderFieldName,
  folderID,
  FolderResultsComponent: InitialFolderResultsComponent,
  onItemClick: onItemClickFromProps,
  search,
  sort = 'name',
  subfolders,
}: FolderProviderProps) {
  const parentFolderContext = useFolder()
  const { config } = useConfig()
  const { routes } = config
  const drawerDepth = useDrawerDepth()
  const { t } = useTranslation()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const locale = useLocale()
  const localeCode = locale ? locale.code : undefined

  const currentlySelectedIndexes = React.useRef(new Set<number>())

  const [selectedFolderCollections, setSelectedFolderCollections] = React.useState<
    CollectionSlug[]
  >([])
  const [FolderResultsComponent, setFolderResultsComponent] = React.useState(
    InitialFolderResultsComponent || (() => null),
  )
  const [folderCollectionConfig] = React.useState(() =>
    config.collections.find(
      (collection) => config.folders && collection.slug === config.folders.slug,
    ),
  )
  const folderCollectionSlug = folderCollectionConfig.slug

  const rawSearchParams = useSearchParams()
  const searchParams = React.useMemo(() => parseSearchParams(rawSearchParams), [rawSearchParams])
  const [currentQuery, setCurrentQuery] = React.useState<FolderQueryParams>(searchParams)

  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedItemKeys, setSelectedItemKeys] = React.useState<Set<FolderDocumentItemKey>>(
    () => new Set(),
  )
  const [focusedRowIndex, setFocusedRowIndex] = React.useState(-1)
  // This is used to determine what data to display on the drag overlay
  const [dragOverlayItem, setDragOverlayItem] = React.useState<FolderOrDocument | undefined>()
  const [breadcrumbs, setBreadcrumbs] =
    React.useState<FolderContextValue['breadcrumbs']>(_breadcrumbsFromProps)
  const lastClickTime = React.useRef<null | number>(null)
  const totalCount = subfolders.length + documents.length

  const clearSelections = React.useCallback(() => {
    setFocusedRowIndex(-1)
    setSelectedItemKeys(new Set())
    setDragOverlayItem(undefined)
    currentlySelectedIndexes.current = new Set()
  }, [])

  const mergeQuery = React.useCallback(
    (newQuery: Partial<FolderQueryParams> = {}): Partial<FolderQueryParams> => {
      let page = 'page' in newQuery ? newQuery.page : currentQuery?.page

      if ('search' in newQuery) {
        page = '1'
      }

      const mergedQuery = {
        ...currentQuery,
        ...newQuery,
        locale: localeCode,
        page,
        relationTo: 'relationTo' in newQuery ? newQuery.relationTo : currentQuery?.relationTo,
        search: 'search' in newQuery ? newQuery.search : currentQuery?.search,
        sort: 'sort' in newQuery ? newQuery.sort : (currentQuery?.sort ?? undefined),
      }

      return mergedQuery
    },
    [currentQuery, localeCode],
  )

  const refineFolderData: FolderContextValue['refineFolderData'] = React.useCallback(
    ({ query, updateURL }) => {
      if (updateURL) {
        const queryParams = mergeQuery(query)

        startRouteTransition(() =>
          router.replace(
            `${qs.stringify({ ...queryParams, relationTo: JSON.stringify(queryParams.relationTo) }, { addQueryPrefix: true })}`,
          ),
        )

        setCurrentQuery(queryParams)
      }
    },
    [mergeQuery, router, startRouteTransition],
  )

  const getFolderRoute: FolderContextValue['getFolderRoute'] = React.useCallback(
    (toFolderID) => {
      const queryParams = qs.stringify(mergeQuery({ page: '1', search: '' }), {
        addQueryPrefix: true,
      })
      return formatAdminURL({
        adminRoute: config.routes.admin,
        path: `${baseFolderPath}${toFolderID ? `/${toFolderID}` : ''}${queryParams}`,
      })
    },
    [baseFolderPath, config.routes.admin, mergeQuery],
  )

  const getItem = React.useCallback(
    (itemKey: FolderDocumentItemKey) => {
      return [...subfolders, ...documents].find((doc) => doc.itemKey === itemKey)
    },
    [documents, subfolders],
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
      if (drawerDepth === 1) {
        // not in a drawer (default is 1)
        if (collectionSlug === folderCollectionSlug) {
          // clicked on folder, take the user to the folder view
          startRouteTransition(() => {
            router.push(getFolderRoute(docID))
            clearSelections()
          })
        } else if (collectionSlug) {
          // clicked on document, take the user to the documet view
          startRouteTransition(() => {
            router.push(
              formatAdminURL({
                adminRoute: config.routes.admin,
                path: `/collections/${collectionSlug}/${docID}`,
              }),
            )
            clearSelections()
          })
        }
      } else {
        clearSelections()
      }

      if (typeof onItemClickFromProps === 'function') {
        onItemClickFromProps(getItem(`${collectionSlug}-${docID}`))
      }
    },
    [
      clearSelections,
      config.routes.admin,
      drawerDepth,
      folderCollectionSlug,
      getFolderRoute,
      getItem,
      onItemClickFromProps,
      router,
      startRouteTransition,
    ],
  )

  const handleShiftSelection = React.useCallback(
    (targetIndex: number) => {
      const allItems = [...subfolders, ...documents]

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
    [subfolders, documents, selectedItemKeys],
  )

  const updateSelections = React.useCallback(
    ({ indexes }: { indexes: number[] }) => {
      const allItems = [...subfolders, ...documents]
      const { newSelectedFolderCollections, newSelectedItemKeys } = allItems.reduce(
        (acc, item, index) => {
          if (indexes.includes(index)) {
            acc.newSelectedItemKeys.add(item.itemKey)
            if (item.relationTo === folderCollectionSlug) {
              item.value.folderType?.forEach((collectionSlug) => {
                if (!acc.newSelectedFolderCollections.includes(collectionSlug)) {
                  acc.newSelectedFolderCollections.push(collectionSlug)
                }
              })
            } else {
              if (!acc.newSelectedFolderCollections.includes(item.relationTo)) {
                acc.newSelectedFolderCollections.push(item.relationTo)
              }
            }
          }
          return acc
        },
        {
          newSelectedFolderCollections: [] satisfies CollectionSlug[],
          newSelectedItemKeys: new Set<FolderDocumentItemKey>(),
        },
      )

      setSelectedFolderCollections(newSelectedFolderCollections)
      setSelectedItemKeys(newSelectedItemKeys)
    },
    [documents, folderCollectionSlug, subfolders],
  )

  const onItemKeyPress: FolderContextValue['onItemKeyPress'] = React.useCallback(
    ({ event, item: currentItem }) => {
      const { code, ctrlKey, metaKey, shiftKey } = event
      const isShiftPressed = shiftKey
      const isCtrlPressed = ctrlKey || metaKey
      const isCurrentlySelected = selectedItemKeys.has(currentItem.itemKey)
      const allItems = [...subfolders, ...documents]
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
            const allItems = [...subfolders, ...documents]
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
      subfolders,
      documents,
      allowMultiSelection,
      handleShiftSelection,
      updateSelections,
      navigateAfterSelection,
      clearSelections,
      totalCount,
    ],
  )

  const onItemClick: FolderContextValue['onItemClick'] = React.useCallback(
    ({ event, item: clickedItem }) => {
      let doubleClicked: boolean = false
      const isCtrlPressed = event.ctrlKey || event.metaKey
      const isShiftPressed = event.shiftKey
      const isCurrentlySelected = selectedItemKeys.has(clickedItem.itemKey)
      const allItems = [...subfolders, ...documents]
      const currentItemIndex = allItems.findIndex((item) => item.itemKey === clickedItem.itemKey)

      if (allowMultiSelection && isCtrlPressed) {
        event.preventDefault()
        let overlayItemKey: FolderDocumentItemKey | undefined
        const indexes = allItems.reduce((acc, item, idx) => {
          if (item.itemKey === clickedItem.itemKey) {
            if (isCurrentlySelected && event.type !== 'pointermove') {
              return acc
            } else {
              acc.push(idx)
              overlayItemKey = item.itemKey
            }
          } else if (selectedItemKeys.has(item.itemKey)) {
            acc.push(idx)
          }
          return acc
        }, [])

        updateSelections({ indexes })

        if (overlayItemKey) {
          setDragOverlayItem(getItem(overlayItemKey))
        }
      } else if (allowMultiSelection && isShiftPressed) {
        if (currentItemIndex !== -1) {
          const selectedIndexes = handleShiftSelection(currentItemIndex)
          updateSelections({ indexes: selectedIndexes })
        }
      } else if (allowMultiSelection && event.type === 'pointermove') {
        // on drag start of an unselected item
        if (!isCurrentlySelected) {
          updateSelections({
            indexes: allItems.reduce((acc, item, idx) => {
              if (item.itemKey === clickedItem.itemKey) {
                acc.push(idx)
              }
              return acc
            }, []),
          })
        }
        setDragOverlayItem(getItem(clickedItem.itemKey))
      } else {
        // Normal click - select single item
        const now = Date.now()
        doubleClicked =
          now - lastClickTime.current < 400 && dragOverlayItem?.itemKey === clickedItem.itemKey
        lastClickTime.current = now
        if (!doubleClicked) {
          updateSelections({
            indexes: isCurrentlySelected && selectedItemKeys.size === 1 ? [] : [currentItemIndex],
          })
        }
        setDragOverlayItem(getItem(clickedItem.itemKey))
      }

      if (doubleClicked) {
        navigateAfterSelection({
          collectionSlug: clickedItem.relationTo,
          docID: extractID(clickedItem.value),
        })
      }
    },
    [
      selectedItemKeys,
      subfolders,
      documents,
      allowMultiSelection,
      dragOverlayItem,
      getItem,
      updateSelections,
      navigateAfterSelection,
      handleShiftSelection,
    ],
  )

  /**
   * Makes requests to the server to update the folder field on passed in documents
   *
   * Might rewrite this in the future to return the promises so errors can be handled contextually
   */
  const moveToFolder: FolderContextValue['moveToFolder'] = React.useCallback(
    async (args) => {
      const { itemsToMove: items, toFolderID } = args
      if (!items.length) {
        return
      }

      const movingCurrentFolder =
        items.length === 1 &&
        items[0].relationTo === folderCollectionSlug &&
        items[0].value.id === folderID

      if (movingCurrentFolder) {
        const queryParams = qs.stringify(
          {
            depth: 0,
            locale: localeCode,
          },
          {
            addQueryPrefix: true,
          },
        )
        const req = await fetch(
          formatAdminURL({
            apiRoute: routes.api,
            path: `/${folderCollectionSlug}/${folderID}${queryParams}`,
          }),
          {
            body: JSON.stringify({ [folderFieldName]: toFolderID || null }),
            credentials: 'include',
            headers: {
              'content-type': 'application/json',
            },
            method: 'PATCH',
          },
        )
        if (req.status !== 200) {
          toast.error(t('general:error'))
        }
      } else {
        for (const [collectionSlug, ids] of Object.entries(groupItemIDsByRelation(items))) {
          const queryParams = qs.stringify(
            {
              depth: 0,
              limit: 0,
              locale: localeCode,
              where: {
                id: {
                  in: ids,
                },
              },
            },
            {
              addQueryPrefix: true,
            },
          )
          try {
            await fetch(
              formatAdminURL({
                apiRoute: routes.api,
                path: `/${collectionSlug}${queryParams}`,
              }),
              {
                body: JSON.stringify({ [folderFieldName]: toFolderID || null }),
                credentials: 'include',
                headers: {
                  'content-type': 'application/json',
                },
                method: 'PATCH',
              },
            )
          } catch (error) {
            toast.error(t('general:error'))
            // eslint-disable-next-line no-console
            console.error(error)
            continue
          }
        }
      }

      clearSelections()
    },
    [folderID, clearSelections, folderCollectionSlug, folderFieldName, routes.api, t, localeCode],
  )

  const checkIfItemIsDisabled: FolderContextValue['checkIfItemIsDisabled'] = React.useCallback(
    (item) => {
      function folderAcceptsItem({
        item,
        selectedFolderCollections,
      }: {
        item: FolderOrDocument
        selectedFolderCollections: string[]
      }): boolean {
        if (
          !item.value.folderType ||
          (Array.isArray(item.value.folderType) && item.value.folderType.length === 0)
        ) {
          // Enable folder that accept all collections
          return false
        }

        if (selectedFolderCollections.length === 0) {
          // If no collections are selected, enable folders that accept all collections
          return Boolean(item.value.folderType || item.value.folderType.length > 0)
        }

        // Disable folders that do not accept all of the selected collections
        return selectedFolderCollections.some((slug) => {
          return !item.value.folderType.includes(slug)
        })
      }

      if (isDragging) {
        const isSelected = selectedItemKeys.has(item.itemKey)
        if (isSelected) {
          return true
        } else if (item.relationTo === folderCollectionSlug) {
          return folderAcceptsItem({ item, selectedFolderCollections })
        } else {
          // Non folder items are disabled on drag
          return true
        }
      } else if (parentFolderContext?.selectedItemKeys?.size) {
        // Disable selected items from being navigated to in move to drawer
        if (parentFolderContext.selectedItemKeys.has(item.itemKey)) {
          return true
        }
        // Moving items to folder
        if (item.relationTo === folderCollectionSlug) {
          return folderAcceptsItem({
            item,
            selectedFolderCollections: parentFolderContext.selectedFolderCollections,
          })
        }
        // If the item is not a folder, it is disabled on move
        return true
      }
    },
    [
      selectedFolderCollections,
      isDragging,
      selectedItemKeys,
      folderCollectionSlug,
      parentFolderContext?.selectedFolderCollections,
      parentFolderContext?.selectedItemKeys,
    ],
  )

  // If a new component is provided, update the state so children can re-render with the new component
  React.useEffect(() => {
    if (InitialFolderResultsComponent) {
      setFolderResultsComponent(InitialFolderResultsComponent)
    }
  }, [InitialFolderResultsComponent])

  return (
    <Context
      value={{
        activeCollectionFolderSlugs: activeCollectionSlugs || allCollectionFolderSlugs,
        allCollectionFolderSlugs,
        allowCreateCollectionSlugs,
        breadcrumbs,
        checkIfItemIsDisabled,
        clearSelections,
        currentFolder:
          breadcrumbs?.[breadcrumbs.length - 1]?.id !== undefined
            ? formatFolderOrDocumentItem({
                folderFieldName,
                isUpload: false,
                relationTo: folderCollectionSlug,
                useAsTitle: folderCollectionConfig.admin.useAsTitle,
                value: breadcrumbs[breadcrumbs.length - 1],
              })
            : null,
        documents,
        dragOverlayItem,
        focusedRowIndex,
        folderCollectionConfig,
        folderCollectionSlug,
        folderFieldName,
        folderID,
        FolderResultsComponent,
        folderType: breadcrumbs?.[breadcrumbs.length - 1]?.folderType,
        getFolderRoute,
        getSelectedItems,
        isDragging,
        itemKeysToMove: parentFolderContext.selectedItemKeys,
        moveToFolder,
        onItemClick,
        onItemKeyPress,
        refineFolderData,
        search,
        selectedFolderCollections,
        selectedItemKeys,
        setBreadcrumbs,
        setFocusedRowIndex,
        setIsDragging,
        sort,
        subfolders,
      }}
    >
      {children}
    </Context>
  )
}

export function useFolder(): FolderContextValue {
  const context = React.use(Context)

  if (context === undefined) {
    throw new Error('useFolder must be used within a FolderProvider')
  }

  return context
}
