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
import { useRouteTransition } from '../RouteTransition/index.js'
import { useTranslation } from '../Translation/index.js'
import { getMetaSelection, getShiftSelection, groupItemIDsByRelation } from './selection.js'

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
  clearSelections: () => void
  currentFolder?: FolderOrDocument | null
  documents?: FolderOrDocument[]
  focusedRowIndex: number
  folderCollectionConfig: ClientCollectionConfig
  folderCollectionSlug: string
  folderFieldName: string
  folderID?: number | string
  FolderResultsComponent: React.ReactNode
  getFolderRoute: (toFolderID?: number | string) => string
  getSelectedItems?: () => FolderOrDocument[]
  isDragging: boolean
  itemKeysToMove?: Set<FolderDocumentItemKey>
  lastSelectedIndex: null | number
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
  clearSelections: () => {},
  currentFolder: null,
  documents: [],
  focusedRowIndex: -1,
  folderCollectionConfig: null,
  folderCollectionSlug: '',
  folderFieldName: 'folder',
  folderID: undefined,
  FolderResultsComponent: null,
  getFolderRoute: () => '',
  getSelectedItems: () => [],
  isDragging: false,
  itemKeysToMove: undefined,
  lastSelectedIndex: null,
  moveToFolder: () => Promise.resolve(undefined),
  onItemClick: () => undefined,
  onItemKeyPress: () => undefined,
  refineFolderData: () => undefined,
  search: '',
  selectedItemKeys: new Set<FolderDocumentItemKey>(),
  setBreadcrumbs: () => {},
  setFocusedRowIndex: () => -1,
  setIsDragging: () => false,
  sort: '_folderOrDocumentTitle',
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
  sort = '_folderOrDocumentTitle',
  subfolders,
}: FolderProviderProps) {
  const parentFolderContext = useFolder()
  const { config } = useConfig()
  const { routes, serverURL } = config
  const drawerDepth = useDrawerDepth()
  const { t } = useTranslation()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()

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
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<null | number>(null)
  const [breadcrumbs, setBreadcrumbs] =
    React.useState<FolderContextValue['breadcrumbs']>(_breadcrumbsFromProps)
  const lastClickTime = React.useRef<null | number>(null)
  const totalCount = subfolders.length + documents.length

  const clearSelections = React.useCallback(() => {
    setFocusedRowIndex(-1)
    setSelectedItemKeys(new Set())
    setLastSelectedIndex(undefined)
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
        page,
        search: 'search' in newQuery ? newQuery.search : currentQuery?.search,
        sort: 'sort' in newQuery ? newQuery.sort : (currentQuery?.sort ?? undefined),
      }

      return mergedQuery
    },
    [currentQuery],
  )

  const refineFolderData: FolderContextValue['refineFolderData'] = React.useCallback(
    ({ query, updateURL }) => {
      if (updateURL) {
        const newQuery = mergeQuery(query)
        startRouteTransition(() =>
          router.replace(`${qs.stringify(newQuery, { addQueryPrefix: true })}`),
        )

        setCurrentQuery(newQuery)
      }
    },
    [mergeQuery, router, startRouteTransition],
  )

  const getFolderRoute: FolderContextValue['getFolderRoute'] = React.useCallback(
    (toFolderID) => {
      const newQuery = mergeQuery({ page: '1', search: '' })
      return formatAdminURL({
        adminRoute: config.routes.admin,
        path: `${baseFolderPath}${toFolderID ? `/${toFolderID}` : ''}${qs.stringify(newQuery, { addQueryPrefix: true })}`,
        serverURL: config.serverURL,
      })
    },
    [baseFolderPath, config.routes.admin, config.serverURL, mergeQuery],
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
        clearSelections()
        if (collectionSlug === folderCollectionSlug) {
          // clicked on folder, take the user to the folder view
          startRouteTransition(() => router.push(getFolderRoute(docID)))
        } else if (collectionSlug) {
          // clicked on document, take the user to the documet view
          startRouteTransition(() => {
            router.push(
              formatAdminURL({
                adminRoute: config.routes.admin,
                path: `/collections/${collectionSlug}/${docID}`,
              }),
            )
          })
        }
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

  const onItemKeyPress: FolderContextValue['onItemKeyPress'] = React.useCallback(
    ({ event, index, item }) => {
      const { code, ctrlKey, metaKey, shiftKey } = event
      const isShiftPressed = shiftKey
      const isCtrlPressed = ctrlKey || metaKey
      let newSelectedIndexes: Set<number> | undefined = undefined

      switch (code) {
        case 'ArrowDown': {
          event.preventDefault()
          const nextIndex = Math.min(index + 1, totalCount - 1)
          setFocusedRowIndex(nextIndex)

          if (isCtrlPressed) {
            break
          }

          if (allowMultiSelection && isShiftPressed) {
            newSelectedIndexes = getShiftSelection({
              selectFromIndex: Math.min(lastSelectedIndex, totalCount),
              selectToIndex: Math.min(nextIndex, totalCount),
            })
          } else {
            setLastSelectedIndex(nextIndex)
            newSelectedIndexes = new Set([nextIndex])
          }
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          const prevIndex = Math.max(index - 1, 0)
          setFocusedRowIndex(prevIndex)

          if (isCtrlPressed) {
            break
          }

          if (allowMultiSelection && isShiftPressed) {
            newSelectedIndexes = getShiftSelection({
              selectFromIndex: lastSelectedIndex,
              selectToIndex: prevIndex,
            })
          } else {
            setLastSelectedIndex(prevIndex)
            newSelectedIndexes = new Set([prevIndex])
          }
          break
        }
        case 'Enter': {
          if (selectedItemKeys.size === 1) {
            newSelectedIndexes = new Set([])
            setFocusedRowIndex(undefined)
          }
          break
        }
        case 'Escape': {
          setFocusedRowIndex(undefined)
          newSelectedIndexes = new Set([])
          break
        }
        case 'KeyA': {
          if (allowMultiSelection && isCtrlPressed) {
            event.preventDefault()
            setFocusedRowIndex(totalCount - 1)
            newSelectedIndexes = new Set(Array.from({ length: totalCount }, (_, i) => i))
          }
          break
        }
        case 'Space': {
          if (allowMultiSelection && isShiftPressed) {
            event.preventDefault()
            newSelectedIndexes = getMetaSelection({
              currentSelection: newSelectedIndexes,
              toggleIndex: index,
            })
            setLastSelectedIndex(index)
          } else {
            event.preventDefault()
            newSelectedIndexes = new Set([index])
            setLastSelectedIndex(index)
          }
          break
        }
        case 'Tab': {
          if (allowMultiSelection && isShiftPressed) {
            const prevIndex = index - 1
            if (prevIndex < 0 && newSelectedIndexes?.size > 0) {
              setFocusedRowIndex(prevIndex)
            }
          } else {
            const nextIndex = index + 1
            if (nextIndex === totalCount && selectedItemKeys.size > 0) {
              setFocusedRowIndex(totalCount - 1)
            }
          }
          break
        }
      }

      if (!newSelectedIndexes) {
        return
      }

      setSelectedItemKeys(
        [...subfolders, ...documents].reduce((acc, item, index) => {
          if (newSelectedIndexes?.size && newSelectedIndexes.has(index)) {
            acc.add(item.itemKey)
          }
          return acc
        }, new Set<FolderDocumentItemKey>()),
      )

      if (selectedItemKeys.size === 1 && code === 'Enter') {
        navigateAfterSelection({
          collectionSlug: item.relationTo,
          docID: extractID(item.value),
        })
      }
    },
    [
      allowMultiSelection,
      documents,
      lastSelectedIndex,
      navigateAfterSelection,
      subfolders,
      totalCount,
      selectedItemKeys,
    ],
  )

  const onItemClick: FolderContextValue['onItemClick'] = React.useCallback(
    ({ event, index, item }) => {
      let doubleClicked: boolean = false
      const isCtrlPressed = event.ctrlKey || event.metaKey
      const isShiftPressed = event.shiftKey
      let newSelectedIndexes: Set<number> | undefined = undefined

      if (allowMultiSelection && isCtrlPressed) {
        newSelectedIndexes = getMetaSelection({
          currentSelection: newSelectedIndexes,
          toggleIndex: index,
        })
      } else if (allowMultiSelection && isShiftPressed && lastSelectedIndex !== undefined) {
        newSelectedIndexes = getShiftSelection({
          selectFromIndex: lastSelectedIndex,
          selectToIndex: index,
        })
      } else if (allowMultiSelection && event.type === 'pointermove') {
        // on drag start of an unselected item
        if (!selectedItemKeys.has(item.itemKey)) {
          newSelectedIndexes = new Set([index])
        }
        setLastSelectedIndex(index)
      } else {
        // Normal click - select single item
        newSelectedIndexes = new Set([index])
        const now = Date.now()
        doubleClicked = now - lastClickTime.current < 400 && lastSelectedIndex === index
        lastClickTime.current = now
        setLastSelectedIndex(index)
      }

      if (!newSelectedIndexes) {
        setFocusedRowIndex(undefined)
      } else {
        setFocusedRowIndex(index)
      }

      if (newSelectedIndexes) {
        setSelectedItemKeys(
          [...subfolders, ...documents].reduce((acc, item, index) => {
            if (newSelectedIndexes.size && newSelectedIndexes.has(index)) {
              acc.add(item.itemKey)
            }
            return acc
          }, new Set<FolderDocumentItemKey>()),
        )
      }

      if (doubleClicked) {
        navigateAfterSelection({
          collectionSlug: item.relationTo,
          docID: extractID(item.value),
        })
      }
    },
    [
      selectedItemKeys,
      allowMultiSelection,
      lastSelectedIndex,
      subfolders,
      documents,
      navigateAfterSelection,
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
        const req = await fetch(
          `${serverURL}${routes.api}/${folderCollectionSlug}/${folderID}?depth=0`,
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
          const query = qs.stringify(
            {
              depth: 0,
              limit: 0,
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
            await fetch(`${serverURL}${routes.api}/${collectionSlug}${query}`, {
              body: JSON.stringify({ [folderFieldName]: toFolderID || null }),
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
            continue
          }
        }
      }

      clearSelections()
    },
    [folderID, clearSelections, folderCollectionSlug, folderFieldName, routes.api, serverURL, t],
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
        clearSelections,
        currentFolder: breadcrumbs?.[0]?.id
          ? formatFolderOrDocumentItem({
              folderFieldName,
              isUpload: false,
              relationTo: folderCollectionSlug,
              useAsTitle: folderCollectionConfig.admin.useAsTitle,
              value: breadcrumbs[breadcrumbs.length - 1],
            })
          : null,
        documents,
        focusedRowIndex,
        folderCollectionConfig,
        folderCollectionSlug,
        folderFieldName,
        folderID,
        FolderResultsComponent,
        getFolderRoute,
        getSelectedItems,
        isDragging,
        itemKeysToMove: parentFolderContext.selectedItemKeys,
        lastSelectedIndex,
        moveToFolder,
        onItemClick,
        onItemKeyPress,
        refineFolderData,
        search,
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
