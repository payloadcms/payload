'use client'

import type { ClientCollectionConfig, CollectionSlug } from 'payload'
import type {
  FolderBreadcrumb,
  FolderInterface,
  FolderOrDocument,
  GetFolderDataResult,
} from 'payload/shared'

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
  filterItems: (args: { relationTo?: CollectionSlug[]; search?: string }) => void
  focusedRowIndex: number
  folderCollectionConfig: ClientCollectionConfig
  folderCollectionSlug: string
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
   * The ID of the current folder
   */
  readonly folderID?: number | string
  /**
   * The intial search query
   */
  readonly search?: string
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
  documents: allDocuments = [],
  filteredCollectionSlugs,
  folderID: _folderIDFromProps = undefined,
  search: _searchFromProps,
  subfolders: allSubfolders = [],
}: FolderProviderProps) {
  const { config, getEntityConfig } = useConfig()
  const { routes, serverURL } = config
  const drawerDepth = useDrawerDepth()
  const { t } = useTranslation()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()

  const [folderCollectionConfig] = React.useState(() =>
    config.collections.find((collection) => collection.slug === config.folders.slug),
  )
  const folderCollectionSlug = folderCollectionConfig.slug

  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedIndexes, setSelectedIndexes] = React.useState<Set<number>>(() => new Set())
  const [focusedRowIndex, setFocusedRowIndex] = React.useState(-1)
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<null | number>(null)
  const [visibleCollectionSlugs, setVisibleCollectionSlugs] = React.useState<CollectionSlug[]>(
    filteredCollectionSlugs || [...Object.keys(config.folders.collections), folderCollectionSlug],
  )
  const [activeFolderID, setActiveFolderID] =
    React.useState<FolderContextValue['folderID']>(_folderIDFromProps)
  const [breadcrumbs, setBreadcrumbs] =
    React.useState<FolderContextValue['breadcrumbs']>(_breadcrumbsFromProps)
  const [subfolders, setSubfolders] = React.useState<FolderContextValue['subfolders']>(() => {
    return filterOutItems({
      items: allSubfolders,
      relationTo: [folderCollectionSlug],
      search: _searchFromProps,
    })
  })
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
      return `/collections/${collectionSlug}/folders`
    } else {
      return config.admin.routes.folders
    }
  })

  const lastClickTime = React.useRef<null | number>(null)
  const totalCount = subfolders.length + documents.length

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
  const populateFolderData = React.useCallback(
    async ({ folderID }) => {
      const folderDataReq = await fetch(
        `${serverURL}${routes.api}/${folderCollectionSlug}/populate-folder-data${folderID ? `?folderID=${folderID}` : ''}`,
        {
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
        },
      )

      if (folderDataReq.status === 200) {
        const folderDataRes: GetFolderDataResult = await folderDataReq.json()
        setBreadcrumbs(folderDataRes?.breadcrumbs || [])
        setSubfolders(folderDataRes?.subfolders || [])
        setDocuments(folderDataRes?.documents || [])
      } else {
        setBreadcrumbs([])
        setSubfolders([])
        setDocuments([])
      }

      setActiveFolderID(folderID)
    },
    [folderCollectionSlug, routes.api, serverURL],
  )

  const setNewActiveFolderID: FolderContextValue['setFolderID'] = React.useCallback(
    async ({ folderID: toFolderID }) => {
      clearSelections()
      if (drawerDepth === 1) {
        // not in a drawer (default is 1)
        startRouteTransition(() =>
          router.push(
            formatAdminURL({
              adminRoute: config.routes.admin,
              path: `${baseFolderPath}${toFolderID ? `/${toFolderID}` : ''}`,
            }),
          ),
        )
      } else {
        await populateFolderData({ folderID: toFolderID })
      }
    },
    [
      clearSelections,
      drawerDepth,
      startRouteTransition,
      router,
      config.routes.admin,
      populateFolderData,
      baseFolderPath,
    ],
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
    ({ relationTo: _relationTo, search: _search }) => {
      const relationTo = collectionSlug ? undefined : _relationTo || visibleCollectionSlugs
      const searchFilter = ((typeof _search === 'string' ? _search : search) || '').trim()

      const filteredDocuments = filterOutItems({
        items: allDocuments,
        relationTo,
        search: searchFilter,
      })
      const filteredSubfolders = filterOutItems({
        items: allSubfolders,
        relationTo: [folderCollectionSlug],
        search: searchFilter,
      })

      setDocuments(filteredDocuments)
      setSubfolders(filteredSubfolders)
      setSearch(searchFilter)
      setVisibleCollectionSlugs(relationTo)

      if (drawerDepth === 1) {
        router.replace(
          formatAdminURL({
            adminRoute: config.routes.admin,
            path: `${baseFolderPath}${activeFolderID ? `/${activeFolderID}` : ''}${qs.stringify(
              {
                relationTo,
                search: searchFilter || undefined,
              },
              { addQueryPrefix: true },
            )}`,
          }),
        )
      }
    },
    [
      collectionSlug,
      visibleCollectionSlugs,
      search,
      allDocuments,
      allSubfolders,
      folderCollectionSlug,
      drawerDepth,
      router,
      config.routes.admin,
      baseFolderPath,
      activeFolderID,
    ],
  )

  const sortItems = React.useCallback((items: FolderOrDocument[]) => {
    return items
  }, [])

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
  const addItems = React.useCallback(
    (items: FolderOrDocument[]) => {
      if (!items.length) {
        return
      }

      const separatedItems = separateItems(items)

      if (separatedItems.documents.length) {
        setDocuments((prevDocs) => {
          return sortItems([...prevDocs, ...separatedItems.documents])
        })
      }

      if (separatedItems.folders.length) {
        setSubfolders((prevFolders) => {
          return sortItems([...prevFolders, ...separatedItems.folders])
        })
      }
    },
    [separateItems, sortItems],
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
          `${serverURL}${routes.api}/${folderCollectionSlug}/${activeFolderID}`,
          {
            body: JSON.stringify({ _parentFolder: toFolderID || null }),
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
          await populateFolderData({
            folderID: updatedDoc.id,
          })
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
              body: JSON.stringify({ _parentFolder: toFolderID || null }),
              credentials: 'include',
              headers: {
                'content-type': 'application/json',
              },
              method: 'PATCH',
            })
            if (res.status === 200) {
              const json = await res.json()
              const { docs } = json as { docs: any[] }
              const formattedItems: FolderOrDocument[] = docs.map<FolderOrDocument>((doc: any) =>
                formatFolderOrDocumentItem({
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
            continue
          }
        }

        if (successfullyMovedDocumentItems.length) {
          setDocuments((prevDocs) => {
            if (movingToCurrentFolder) {
              return sortItems([...prevDocs, ...successfullyMovedDocumentItems])
            } else {
              return prevDocs.filter(
                ({ itemKey }) =>
                  !successfullyMovedDocumentItems.some((item) => item.itemKey === itemKey),
              )
            }
          })
        }

        if (successfullyMovedFolderItems.length) {
          setSubfolders((prevFolders) => {
            if (movingToCurrentFolder) {
              return sortItems([...prevFolders, ...successfullyMovedFolderItems])
            }
            return prevFolders.filter(
              ({ itemKey }) =>
                !successfullyMovedFolderItems.some((item) => item.itemKey === itemKey),
            )
          })
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
      t,
      populateFolderData,
      getEntityConfig,
      sortItems,
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
          ? {
              itemKey: `${folderCollectionSlug}-${activeFolderID}`,
              relationTo: folderCollectionSlug,
              value: {
                id: activeFolderID,
                _folderOrDocumentTitle: breadcrumbs[breadcrumbs.length - 1]?.name,
                _parentFolder: breadcrumbs[breadcrumbs.length - 2]?.id || null,
              },
            }
          : null,
        documents,
        filterItems,
        focusedRowIndex,
        folderCollectionConfig,
        folderCollectionSlug,
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
