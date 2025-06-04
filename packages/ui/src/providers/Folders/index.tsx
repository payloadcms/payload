'use client'

import type { ClientCollectionConfig, CollectionSlug, Document } from 'payload'
import type { FolderBreadcrumb, FolderOrDocument, GetFolderDataResult } from 'payload/shared'

import { useRouter } from 'next/navigation.js'
import { extractID, formatAdminURL, formatFolderOrDocumentItem } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import { useDrawerDepth } from '../../elements/Drawer/index.js'
import { useConfig } from '../Config/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import { useTranslation } from '../Translation/index.js'
import { getMetaSelection, getShiftSelection, groupItemIDsByRelation } from './selection.js'
type SortKeys = keyof Pick<
  FolderOrDocument['value'],
  '_folderOrDocumentTitle' | 'createdAt' | 'updatedAt'
>
type SortDirection = 'asc' | 'desc'
export type FileCardData = {
  filename: string
  id: number | string
  mimeType: string
  name: string
  url: string
}

export type FolderContextValue = {
  addItems: (args: FolderOrDocument[]) => void
  breadcrumbs?: FolderBreadcrumb[]
  clearSelections: () => void
  currentFolder?: FolderOrDocument | null
  documents?: FolderOrDocument[]
  filterItems: (args: { relationTo?: CollectionSlug[]; search?: string }) => Promise<void>
  focusedRowIndex: number
  folderCollectionConfig: ClientCollectionConfig
  folderCollectionSlug: string
  /**
   * Folder enabled collection slugs that can be populated within the provider
   */
  readonly folderCollectionSlugs?: CollectionSlug[]
  folderFieldName: string
  folderID?: number | string
  getSelectedItems?: () => FolderOrDocument[]
  isDragging: boolean
  lastSelectedIndex: null | number
  moveToFolder: (args: {
    itemsToMove: FolderOrDocument[]
    toFolderID?: number | string
  }) => Promise<void>
  onItemClick: (args: {
    event: React.MouseEvent
    index: number
    item: FolderOrDocument
  }) => Promise<void> | void
  onItemKeyPress: (args: {
    event: React.KeyboardEvent
    index: number
    item: FolderOrDocument
  }) => Promise<void> | void
  removeItems: (args: FolderOrDocument[]) => void
  renameFolder: (args: { folderID: number | string; newName: string }) => void
  search: string
  selectedIndexes: Set<number>
  setBreadcrumbs: React.Dispatch<React.SetStateAction<FolderBreadcrumb[]>>
  setFocusedRowIndex: React.Dispatch<React.SetStateAction<number>>
  setFolderID: (args: { folderID: number | string }) => Promise<void> | void
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>
  sortAndUpdateState: (args: {
    documentsToSort?: FolderOrDocument[]
    sortDirection?: 'asc' | 'desc'
    sortOn?: SortKeys
    subfoldersToSort?: FolderOrDocument[]
  }) => void
  sortDirection: SortDirection
  sortOn: SortKeys
  subfolders?: FolderOrDocument[]
  visibleCollectionSlugs: CollectionSlug[]
}

const Context = React.createContext<FolderContextValue>({
  addItems: () => {},
  breadcrumbs: [],
  clearSelections: () => {},
  currentFolder: null,
  documents: [],
  filterItems: () => undefined,
  focusedRowIndex: -1,
  folderCollectionConfig: null,
  folderCollectionSlug: '',
  folderCollectionSlugs: [],
  folderFieldName: 'folder',
  folderID: undefined,
  getSelectedItems: () => [],
  isDragging: false,
  lastSelectedIndex: null,
  moveToFolder: () => Promise.resolve(undefined),
  onItemClick: () => undefined,
  onItemKeyPress: () => undefined,
  removeItems: () => undefined,
  renameFolder: () => undefined,
  search: '',
  selectedIndexes: new Set(),
  setBreadcrumbs: () => {},
  setFocusedRowIndex: () => -1,
  setFolderID: () => null,
  setIsDragging: () => false,
  sortAndUpdateState: () => undefined,
  sortDirection: 'asc',
  sortOn: '_folderOrDocumentTitle',
  subfolders: [],
  visibleCollectionSlugs: [],
})

function filterOutItems({
  items,
  relationTo,
  search,
}: {
  items: FolderOrDocument[]
  relationTo?: CollectionSlug[]
  search?: string
}) {
  if (typeof search !== 'string' && relationTo === undefined) {
    return items
  }

  const searchLower = (search || '').toLowerCase()

  return items.filter((item) => {
    const itemTitle = item.value._folderOrDocumentTitle.toLowerCase()
    const itemRelationTo = item.relationTo

    return (
      (relationTo ? relationTo.includes(itemRelationTo) : true) &&
      (!searchLower || itemTitle.includes(searchLower))
    )
  })
}

export type FolderProviderProps = {
  readonly allowMultiSelection?: boolean
  /**
   * Breadcrumbs for the current folder
   */
  readonly breadcrumbs?: FolderBreadcrumb[]
  /**
   * Children to render inside the provider
   */
  readonly children: React.ReactNode
  /**
   * Required for collection-folder views
   */
  readonly collectionSlug?: CollectionSlug
  /**
   * All documents in the current folder
   */
  readonly documents: FolderOrDocument[]
  /**
   * The collection slugs that are being viewed
   */
  readonly filteredCollectionSlugs?: CollectionSlug[]
  /**
   * Folder enabled collection slugs that can be populated within the provider
   */
  readonly folderCollectionSlugs: CollectionSlug[]
  /**
   * The name of the field that contains the folder relation
   */
  readonly folderFieldName: string
  /**
   * The ID of the current folder
   */
  readonly folderID?: number | string
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
  readonly sort?: `-${SortKeys}` | SortKeys
  /**
   * All subfolders in the current folder
   */
  readonly subfolders: FolderOrDocument[]
}
export function FolderProvider({
  allowMultiSelection = true,
  breadcrumbs: _breadcrumbsFromProps = [],
  children,
  collectionSlug,
  documents: allDocumentsFromProps = [],
  filteredCollectionSlugs,
  folderCollectionSlugs = [],
  folderFieldName,
  folderID: _folderIDFromProps = undefined,
  search: _searchFromProps,
  sort,
  subfolders: subfoldersFromProps = [],
}: FolderProviderProps) {
  const parentFolderContext = useFolder()
  const { config, getEntityConfig } = useConfig()
  const { routes, serverURL } = config
  const drawerDepth = useDrawerDepth()
  const { t } = useTranslation()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()

  const [folderCollectionConfig] = React.useState(() =>
    config.collections.find(
      (collection) => config.folders && collection.slug === config.folders.slug,
    ),
  )
  const folderCollectionSlug = folderCollectionConfig.slug

  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedIndexes, setSelectedIndexes] = React.useState<Set<number>>(() => new Set())
  const [focusedRowIndex, setFocusedRowIndex] = React.useState(-1)
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<null | number>(null)
  const [visibleCollectionSlugs, setVisibleCollectionSlugs] = React.useState<CollectionSlug[]>(
    filteredCollectionSlugs || [...folderCollectionSlugs, folderCollectionSlug],
  )
  const [activeFolderID, setActiveFolderID] =
    React.useState<FolderContextValue['folderID']>(_folderIDFromProps)
  const [breadcrumbs, setBreadcrumbs] =
    React.useState<FolderContextValue['breadcrumbs']>(_breadcrumbsFromProps)
  const [allSubfolders, setAllSubfolders] = React.useState<FolderOrDocument[]>(subfoldersFromProps)
  const [subfolders, setSubfolders] = React.useState<FolderContextValue['subfolders']>(() => {
    return filterOutItems({
      items: allSubfolders,
      relationTo: visibleCollectionSlugs.includes(folderCollectionSlug)
        ? [folderCollectionSlug]
        : [],
      search: _searchFromProps,
    })
  })
  const [allDocuments, setAllDocuments] = React.useState<FolderOrDocument[]>(allDocumentsFromProps)
  const [documents, setDocuments] = React.useState<FolderContextValue['documents']>(() =>
    filterOutItems({
      items: allDocuments,
      relationTo: visibleCollectionSlugs,
      search: _searchFromProps,
    }),
  )
  const [search, setSearch] = React.useState<string | undefined>(_searchFromProps)
  const [baseFolderPath] = React.useState<`/${string}`>(() => {
    if (collectionSlug) {
      return `/collections/${collectionSlug}/${folderCollectionSlug}`
    } else {
      return config.admin.routes.browseByFolder
    }
  })
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(() => {
    if (sort) {
      return sort.startsWith('-') ? 'desc' : 'asc'
    }
    return 'asc'
  })
  const [sortOn, setSortOn] = React.useState<SortKeys>(() => {
    if (sort) {
      return sort.replace(/^-/, '') as SortKeys
    }
    return '_folderOrDocumentTitle'
  })

  const lastClickTime = React.useRef<null | number>(null)
  const totalCount = subfolders.length + documents.length

  const formatFolderURL = React.useCallback(
    (args: {
      folderID?: number | string
      relationTo?: string[]
      search?: string
      sortBy?: SortKeys
      sortDirection?: SortDirection
    }) => {
      const newFolderID = 'folderID' in args ? args.folderID : activeFolderID
      const params = {
        relationTo:
          'relationTo' in args
            ? args.relationTo
            : collectionSlug
              ? undefined
              : visibleCollectionSlugs,
        search: 'search' in args ? args.search : search,
        sortBy: 'sortBy' in args ? args.sortBy : sortOn,
        sortDirection: 'sortDirection' in args ? args.sortDirection : sortDirection,
      }

      return formatAdminURL({
        adminRoute: config.routes.admin,
        path: `${baseFolderPath}${newFolderID ? `/${newFolderID}` : ''}${qs.stringify(params, {
          addQueryPrefix: true,
        })}`,
      })
    },
    [
      activeFolderID,
      baseFolderPath,
      collectionSlug,
      config.routes.admin,
      search,
      sortDirection,
      sortOn,
      visibleCollectionSlugs,
    ],
  )

  const clearSelections = React.useCallback(() => {
    setFocusedRowIndex(-1)
    setSelectedIndexes(new Set())
    setLastSelectedIndex(undefined)
  }, [])

  /**
   * Used to populate drawer data.
   *
   * This is used when the user navigates to a folder.
   */
  const getFolderData = React.useCallback(
    async ({ folderID, search: _search = undefined }): Promise<GetFolderDataResult> => {
      // if folderID is not set, we want to search all documents
      const searchFilter = !folderID
        ? ((typeof _search === 'string' ? _search : search) || '').trim()
        : undefined
      const query = qs.stringify(
        {
          collectionSlug,
          folderID,
          search: searchFilter,
        },
        { addQueryPrefix: true },
      )

      const folderDataReq = await fetch(
        `${serverURL}${routes.api}/${folderCollectionSlug}/populate-folder-data${query}`,
        {
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
        },
      )

      if (folderDataReq.status === 200) {
        const folderDataRes: GetFolderDataResult = await folderDataReq.json()
        setAllSubfolders(folderDataRes.subfolders || [])
        setAllDocuments(folderDataRes.documents || [])
        return folderDataRes
      } else {
        return {
          breadcrumbs: [],
          documents: [],
          subfolders: [],
        }
      }
    },
    [folderCollectionSlug, search, routes.api, serverURL, collectionSlug],
  )

  const setNewActiveFolderID: FolderContextValue['setFolderID'] = React.useCallback(
    async ({ folderID: toFolderID }) => {
      clearSelections()
      if (drawerDepth === 1) {
        // not in a drawer (default is 1)
        startRouteTransition(() =>
          router.push(
            formatFolderURL({
              folderID: toFolderID,
            }),
          ),
        )
      } else {
        const folderDataRes = await getFolderData({ folderID: toFolderID })
        setBreadcrumbs(folderDataRes?.breadcrumbs || [])
        setSubfolders(folderDataRes?.subfolders || [])
        setDocuments(folderDataRes?.documents || [])
        setActiveFolderID(toFolderID)
      }
    },
    [clearSelections, drawerDepth, startRouteTransition, router, formatFolderURL, getFolderData],
  )

  const getSelectedItems = React.useCallback(() => {
    return Array.from(selectedIndexes).reduce((acc, index) => {
      const item = [...subfolders, ...documents][index]
      if (item) {
        acc.push(item)
      }
      return acc
    }, [])
  }, [documents, selectedIndexes, subfolders])

  const navigateAfterSelection = React.useCallback(
    async ({ collectionSlug, docID }: { collectionSlug: string; docID: number | string }) => {
      if (collectionSlug === folderCollectionSlug) {
        await setNewActiveFolderID({ folderID: docID })
      } else if (collectionSlug) {
        router.push(
          formatAdminURL({
            adminRoute: config.routes.admin,
            path: `/collections/${collectionSlug}/${docID}`,
          }),
        )
      }
    },
    [setNewActiveFolderID, folderCollectionSlug, router, config.routes.admin],
  )

  const onItemKeyPress: FolderContextValue['onItemKeyPress'] = React.useCallback(
    async ({ event, index, item }) => {
      const { code, ctrlKey, metaKey, shiftKey } = event
      const isShiftPressed = shiftKey
      const isCtrlPressed = ctrlKey || metaKey
      let newSelectedIndexes: Set<number> = selectedIndexes

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
          if (selectedIndexes.size === 1) {
            newSelectedIndexes = new Set([])
            setFocusedRowIndex(undefined)
          }
          break
        }
        case 'Escape': {
          setFocusedRowIndex(undefined)
          setSelectedIndexes(new Set([]))
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
            if (prevIndex < 0 && newSelectedIndexes.size > 0) {
              setFocusedRowIndex(prevIndex)
            }
          } else {
            const nextIndex = index + 1
            if (nextIndex === totalCount && newSelectedIndexes.size > 0) {
              setFocusedRowIndex(totalCount - 1)
            }
          }
          break
        }
      }

      setSelectedIndexes(newSelectedIndexes)
      if (selectedIndexes.size === 1 && code === 'Enter') {
        await navigateAfterSelection({
          collectionSlug: item.relationTo,
          docID: extractID(item.value),
        })
      }
    },
    [allowMultiSelection, lastSelectedIndex, navigateAfterSelection, selectedIndexes, totalCount],
  )

  const onItemClick: FolderContextValue['onItemClick'] = React.useCallback(
    async ({ event, index, item }) => {
      let doubleClicked: boolean = false
      const isCtrlPressed = event.ctrlKey || event.metaKey
      const isShiftPressed = event.shiftKey
      let newSelectedIndexes = new Set(selectedIndexes)

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
        if (!selectedIndexes.has(index)) {
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

      if (newSelectedIndexes.size === 0) {
        setFocusedRowIndex(undefined)
      } else {
        setFocusedRowIndex(index)
      }

      setSelectedIndexes(newSelectedIndexes)
      if (doubleClicked) {
        await navigateAfterSelection({
          collectionSlug: item.relationTo,
          docID: extractID(item.value),
        })
      }
    },
    [selectedIndexes, lastSelectedIndex, allowMultiSelection, navigateAfterSelection],
  )

  const filterItems: FolderContextValue['filterItems'] = React.useCallback(
    async ({ relationTo: _relationTo, search: _search }) => {
      const relationTo = Array.isArray(_relationTo) ? _relationTo : visibleCollectionSlugs
      const searchFilter = ((typeof _search === 'string' ? _search : search) || '').trim()

      let filteredDocuments: FolderOrDocument[] = allDocuments
      let filteredSubfolders: FolderOrDocument[] = allSubfolders

      if (collectionSlug && !activeFolderID && _search !== search) {
        // this allows us to search all documents in the collection when we are not in a folder and in the folder-collection view
        const res = await getFolderData({
          folderID: activeFolderID,
          search: searchFilter,
        })
        filteredDocuments = filterOutItems({
          items: res.documents,
          relationTo,
          search: searchFilter,
        })
        filteredSubfolders = filterOutItems({
          items: res.subfolders,
          relationTo: [folderCollectionSlug],
          search: searchFilter,
        })
      } else {
        filteredDocuments = filterOutItems({
          items: allDocuments,
          relationTo,
          search: searchFilter,
        })
        filteredSubfolders = filterOutItems({
          items: allSubfolders,
          relationTo: relationTo.includes(folderCollectionSlug) ? [folderCollectionSlug] : [],
          search: searchFilter,
        })
      }

      setDocuments(filteredDocuments)
      setSubfolders(filteredSubfolders)
      setSearch(searchFilter)
      setVisibleCollectionSlugs(relationTo)

      if (drawerDepth === 1) {
        router.replace(
          formatFolderURL({
            relationTo,
            search: searchFilter || undefined,
          }),
        )
      }
    },
    [
      collectionSlug,
      visibleCollectionSlugs,
      search,
      activeFolderID,
      allDocuments,
      allSubfolders,
      folderCollectionSlug,
      drawerDepth,
      getFolderData,
      router,
      formatFolderURL,
    ],
  )

  const sortItems = React.useCallback(
    ({
      documentsToSort,
      sortDirection: sortDirectionArg,
      sortOn: sortOnArg,
      subfoldersToSort,
    }: Parameters<FolderContextValue['sortAndUpdateState']>[0]): {
      newURL?: string
      sortedDocuments?: FolderOrDocument[]
      sortedSubfolders?: FolderOrDocument[]
    } => {
      let sortedDocuments: FolderOrDocument[] | undefined
      let sortedSubfolders: FolderOrDocument[] | undefined
      const sortDirectionToUse = sortDirectionArg || sortDirection
      const sortOnToUse = sortOnArg || sortOn

      if (sortOnArg) {
        setSortOn(sortOnArg)
      }

      if (sortDirectionArg) {
        setSortDirection(sortDirectionArg)
      }

      const newURL = formatFolderURL({
        sortBy: sortOnArg || sortOn,
        sortDirection: sortDirectionArg || sortDirection,
      })

      if (documentsToSort) {
        sortedDocuments = [...documentsToSort].sort((a, b) => {
          const aValue = a.value[sortOnToUse]
          const bValue = b.value[sortOnToUse]

          if (aValue == null && bValue == null) {
            return 0
          }
          if (aValue == null) {
            return sortDirectionToUse === 'asc' ? 1 : -1
          }
          if (bValue == null) {
            return sortDirectionToUse === 'asc' ? -1 : 1
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirectionToUse === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue)
          }

          return 0
        })
      }

      if (subfoldersToSort) {
        sortedSubfolders = [...subfoldersToSort].sort((a, b) => {
          const aValue = a.value[sortOnToUse]
          const bValue = b.value[sortOnToUse]

          if (aValue == null && bValue == null) {
            return 0
          }
          if (aValue == null) {
            return sortDirectionToUse === 'asc' ? 1 : -1
          }
          if (bValue == null) {
            return sortDirectionToUse === 'asc' ? -1 : 1
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirectionToUse === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue)
          }

          return 0
        })
      }

      return {
        newURL,
        sortedDocuments,
        sortedSubfolders,
      }
    },
    [formatFolderURL, sortDirection, sortOn],
  )

  const sortAndUpdateState: FolderContextValue['sortAndUpdateState'] = React.useCallback(
    ({ documentsToSort, sortDirection: sortDirectionArg, sortOn: sortOnArg, subfoldersToSort }) => {
      const { newURL, sortedDocuments, sortedSubfolders } = sortItems({
        documentsToSort,
        sortDirection: sortDirectionArg,
        sortOn: sortOnArg,
        subfoldersToSort,
      })

      if (sortedDocuments) {
        setDocuments(sortedDocuments)
      }
      if (sortedSubfolders) {
        setSubfolders(sortedSubfolders)
      }

      if (drawerDepth === 1) {
        // not in a drawer (default is 1)
        startRouteTransition(() => {
          router.replace(newURL)
        })
      }
    },
    [drawerDepth, router, sortItems, startRouteTransition],
  )

  const separateItems = React.useCallback(
    (
      items: FolderOrDocument[],
    ): {
      documents: FolderOrDocument[]
      folders: FolderOrDocument[]
    } => {
      return items.reduce(
        (acc, item) => {
          if (item.relationTo === folderCollectionSlug) {
            acc.folders.push(item)
          } else {
            acc.documents.push(item)
          }
          return acc
        },
        { documents: [] as FolderOrDocument[], folders: [] as FolderOrDocument[] },
      )
    },
    [folderCollectionSlug],
  )

  /**
   * Used to remove items from the current state.
   *
   * Does NOT handle the request to the server.
   * Useful when a document is deleted and it needs to be removed
   * from the current state.
   */
  const removeItems: FolderContextValue['removeItems'] = React.useCallback(
    (items) => {
      if (!items.length) {
        return
      }

      const separatedItems = separateItems(items)

      if (separatedItems.documents.length) {
        setDocuments((prevDocs) => {
          return prevDocs.filter(
            ({ itemKey }) => !separatedItems.documents.some((item) => item.itemKey === itemKey),
          )
        })
      }

      if (separatedItems.folders.length) {
        setSubfolders((prevFolders) => {
          return prevFolders.filter(
            ({ itemKey }) => !separatedItems.folders.some((item) => item.itemKey === itemKey),
          )
        })
      }

      clearSelections()
    },
    [clearSelections, separateItems, setDocuments, setSubfolders],
  )

  /**
   * Used to add items to the current state.
   *
   * Does NOT handle the request to the server.
   * Used when a document needs to be added to the current state.
   */
  const addItems: FolderContextValue['addItems'] = React.useCallback(
    (itemsToAdd) => {
      const { items, parentItems } = itemsToAdd.reduce(
        (acc, item) => {
          const destinationFolderID = item.value.folderID || null
          if (
            (item.value.folderID && item.value.folderID === activeFolderID) ||
            (!activeFolderID && !item.value.folderID)
          ) {
            acc.items.push(item)
          }

          if (
            parentFolderContext &&
            ((parentFolderContext.folderID &&
              destinationFolderID === parentFolderContext.folderID) ||
              (!parentFolderContext.folderID && !item.value.folderID))
          ) {
            acc.parentItems.push(item)
          }

          return acc
        },
        { items: [], parentItems: [] },
      )

      if (parentItems.length) {
        parentFolderContext.addItems(parentItems)
      }

      if (!items.length) {
        return
      }

      const separatedItems = separateItems(items)

      let documentsToSort = undefined
      let subfoldersToSort = undefined

      if (separatedItems.documents.length) {
        documentsToSort = [...documents, ...separatedItems.documents]
      }

      if (separatedItems.folders.length) {
        subfoldersToSort = [...subfolders, ...separatedItems.folders]
      }

      const { sortedDocuments, sortedSubfolders } = sortItems({
        documentsToSort,
        subfoldersToSort,
      })

      const { sortedDocuments: sortedAllDocuments, sortedSubfolders: sortedAllSubfolders } =
        sortItems({
          documentsToSort,
          subfoldersToSort,
        })

      if (sortedDocuments) {
        setDocuments(sortedDocuments)
        setAllDocuments(sortedAllDocuments)
      }
      if (sortedSubfolders) {
        setSubfolders(sortedSubfolders)
        setAllSubfolders(sortedAllSubfolders)
      }
    },
    [activeFolderID, documents, separateItems, sortItems, subfolders, parentFolderContext],
  )

  /**
   * Used to move items to a different folder.
   *
   * Handles the request to the server and updates the state.
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
        items[0].value.id === activeFolderID

      if (movingCurrentFolder) {
        const req = await fetch(
          `${serverURL}${routes.api}/${folderCollectionSlug}/${activeFolderID}?depth=0`,
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
        } else {
          const updatedDoc = await req.json()
          const folderRes = await getFolderData({
            folderID: updatedDoc.id,
          })
          setBreadcrumbs(folderRes?.breadcrumbs || [])
          setSubfolders(folderRes?.subfolders || [])
          setDocuments(folderRes?.documents || [])
          setActiveFolderID(updatedDoc.id)
        }
        setBreadcrumbs((prevBreadcrumbs) => {
          return prevBreadcrumbs.map((breadcrumb) => {
            if (breadcrumb.id === activeFolderID) {
              return {
                ...breadcrumb,
                id: toFolderID,
              }
            }
            return breadcrumb
          })
        })
      } else {
        const movingToCurrentFolder: boolean = toFolderID === activeFolderID
        const successfullyMovedFolderItems: FolderOrDocument[] = []
        const successfullyMovedDocumentItems: FolderOrDocument[] = []

        for (const [collectionSlug, ids] of Object.entries(groupItemIDsByRelation(items))) {
          const collectionConfig = getEntityConfig({ collectionSlug })
          const query = qs.stringify(
            {
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
            const res = await fetch(`${serverURL}${routes.api}/${collectionSlug}${query}`, {
              body: JSON.stringify({ [folderFieldName]: toFolderID || null }),
              credentials: 'include',
              headers: {
                'content-type': 'application/json',
              },
              method: 'PATCH',
            })
            if (res.status === 200) {
              const json = await res.json()
              const { docs } = json as { docs: Document[] }
              const formattedItems: FolderOrDocument[] = docs.map<FolderOrDocument>(
                (doc: Document) =>
                  formatFolderOrDocumentItem({
                    folderFieldName,
                    isUpload: Boolean(collectionConfig.upload),
                    relationTo: collectionSlug,
                    useAsTitle: collectionConfig.admin.useAsTitle,
                    value: doc,
                  }),
              )
              if (collectionSlug === folderCollectionSlug) {
                successfullyMovedFolderItems.push(...formattedItems)
              } else {
                successfullyMovedDocumentItems.push(...formattedItems)
              }
            }
          } catch (error) {
            toast.error(t('general:error'))
            // eslint-disable-next-line no-console
            console.error(error)
            continue
          }
        }

        if (movingToCurrentFolder) {
          // need to sort if we are moving (adding) items to the current folder
          const { newURL, sortedDocuments, sortedSubfolders } = sortItems({
            documentsToSort: successfullyMovedDocumentItems.length
              ? [...documents, ...successfullyMovedDocumentItems]
              : undefined,
            subfoldersToSort: successfullyMovedFolderItems.length
              ? [...subfolders, ...successfullyMovedFolderItems]
              : undefined,
          })

          if (sortedDocuments) {
            setDocuments(sortedDocuments)
          }
          if (sortedSubfolders) {
            setSubfolders(sortedSubfolders)
          }

          if (drawerDepth === 1 && newURL) {
            // not in a drawer (default is 1)
            router.replace(newURL)
          }
        } else {
          // no need to sort, just remove the items from the current state
          const filteredDocuments = successfullyMovedDocumentItems.length
            ? documents.filter(
                ({ itemKey }) =>
                  !successfullyMovedDocumentItems.some((item) => item.itemKey === itemKey),
              )
            : undefined
          const filteredSubfolders = successfullyMovedFolderItems.length
            ? subfolders.filter(
                ({ itemKey }) =>
                  !successfullyMovedFolderItems.some((item) => item.itemKey === itemKey),
              )
            : undefined

          if (filteredDocuments) {
            setDocuments(filteredDocuments)
          }
          if (filteredSubfolders) {
            setSubfolders(filteredSubfolders)
          }
        }
      }

      clearSelections()
    },
    [
      folderCollectionSlug,
      activeFolderID,
      clearSelections,
      serverURL,
      routes.api,
      folderFieldName,
      t,
      getFolderData,
      getEntityConfig,
      sortItems,
      documents,
      subfolders,
      drawerDepth,
      router,
    ],
  )

  /**
   * Used to rename a folder in the current state.
   *
   * Does NOT handle the request to the server.
   * Used when the user renames a folder using the drawer
   * and it needs to be updated in the current state.
   */
  const renameFolder: FolderContextValue['renameFolder'] = React.useCallback(
    ({ folderID: updatedFolderID, newName }) => {
      if (activeFolderID === updatedFolderID) {
        // updating the curent folder
        setBreadcrumbs((prevBreadcrumbs) => {
          return prevBreadcrumbs.map((breadcrumb) => {
            if (breadcrumb.id === updatedFolderID) {
              return {
                ...breadcrumb,
                name: newName,
              }
            }
            return breadcrumb
          })
        })
      } else {
        setSubfolders((prevFolders) => {
          return prevFolders.map((folder) => {
            if (folder.value.id === updatedFolderID && folder.relationTo === folderCollectionSlug) {
              return {
                ...folder,
                value: {
                  ...folder.value,
                  _folderOrDocumentTitle: newName,
                },
              }
            }
            return folder
          })
        })
      }
    },
    [folderCollectionSlug, setSubfolders, activeFolderID],
  )

  return (
    <Context
      value={{
        addItems,
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
        filterItems,
        focusedRowIndex,
        folderCollectionConfig,
        folderCollectionSlug,
        folderCollectionSlugs,
        folderFieldName,
        folderID: activeFolderID,
        getSelectedItems,
        isDragging,
        lastSelectedIndex,
        moveToFolder,
        onItemClick,
        onItemKeyPress,
        removeItems,
        renameFolder,
        search,
        selectedIndexes,
        setBreadcrumbs,
        setFocusedRowIndex,
        setFolderID: setNewActiveFolderID,
        setIsDragging,
        sortAndUpdateState,
        sortDirection,
        sortOn,
        subfolders,
        visibleCollectionSlugs,
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
