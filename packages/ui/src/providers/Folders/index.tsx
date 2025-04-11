'use client'

import type { ClientCollectionConfig, CollectionSlug } from 'payload'

import { useRouter } from 'next/navigation.js'
import {
  extractID,
  type FolderBreadcrumb,
  type FolderInterface,
  formatAdminURL,
  type GetFolderDataResult,
} from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import type { PolymorphicRelationshipValue } from '../../elements/FolderView/types.js'

import { useDrawerDepth } from '../../elements/Drawer/index.js'
import { useConfig } from '../Config/index.js'
import { useListQuery } from '../ListQuery/index.js'
import { useRouteCache } from '../RouteCache/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import { useTranslation } from '../Translation/index.js'
import { getMetaSelection, getShiftSelection } from './selection.js'
export type FileCardData = {
  filename: string
  id: number | string
  mimeType: string
  name: string
  url: string
}

export type FolderContextValue = {
  breadcrumbs?: FolderBreadcrumb[]
  clearSelections: () => void
  collectionUseAsTitles: Map<string, string>
  currentFolder?: FolderInterface | null
  deleteCurrentFolder: () => Promise<Response>
  documents?: GetFolderDataResult['documents']
  focusedRowIndex: number
  folderCollectionConfig: ClientCollectionConfig
  folderCollectionSlug: string
  folderID?: number | string
  getSelectedItems?: () => PolymorphicRelationshipValue[]
  isDragging: boolean
  lastSelectedIndex: null | number
  moveToFolder: (args: {
    itemsToMove: PolymorphicRelationshipValue[]
    toFolderID?: number | string
  }) => Promise<void>
  onItemClick: (args: { event: React.MouseEvent; index: number }) => { doubleClicked: boolean }
  onItemKeyPress: (args: { event: React.KeyboardEvent; index: number }) => { keyCode: string }
  removeItems: (args: PolymorphicRelationshipValue[]) => Promise<void>
  selectedIndexes: Set<number>
  setBreadcrumbs: React.Dispatch<React.SetStateAction<FolderBreadcrumb[]>>
  setDocuments: React.Dispatch<React.SetStateAction<GetFolderDataResult['documents']>>
  setFocusedRowIndex: React.Dispatch<React.SetStateAction<number>>
  setFolderID: (args: { folderID: number | string }) => Promise<void> | void
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>
  setSubfolders: React.Dispatch<React.SetStateAction<GetFolderDataResult['subfolders']>>
  subfolders?: GetFolderDataResult<FolderInterface>['subfolders']
}

const Context = React.createContext<FolderContextValue>({
  breadcrumbs: [],
  clearSelections: () => {},
  collectionUseAsTitles: new Map(),
  currentFolder: null,
  deleteCurrentFolder: () => Promise.resolve(undefined),
  documents: [],
  focusedRowIndex: -1,
  folderCollectionConfig: null,
  folderCollectionSlug: '',
  folderID: undefined,
  getSelectedItems: () => [],
  isDragging: false,
  lastSelectedIndex: null,
  moveToFolder: () => Promise.resolve(undefined),
  onItemClick: () => ({ doubleClicked: false }),
  onItemKeyPress: () => ({ keyCode: '' }),
  removeItems: () => Promise.resolve(undefined),
  selectedIndexes: new Set(),
  setBreadcrumbs: () => {},
  setDocuments: () => [],
  setFocusedRowIndex: () => -1,
  setFolderID: () => Promise.resolve(undefined),
  setIsDragging: () => false,
  setSubfolders: () => {},
  subfolders: [],
})

export type FolderProviderData = {
  documents?: GetFolderDataResult['documents']
  folderID?: number | string
  subfolders?: GetFolderDataResult['subfolders']
} & GetFolderDataResult
type Props = {
  readonly allowMultiSelection?: boolean
  readonly breadcrumbs?: FolderBreadcrumb[]
  readonly children: React.ReactNode
  readonly collectionSlugs?: CollectionSlug[]
  readonly documents?: GetFolderDataResult['documents']
  readonly folderID?: number | string
  readonly subfolders?: GetFolderDataResult['subfolders']
}
export function FolderProvider({
  allowMultiSelection = true,
  breadcrumbs: breadcrumbsFromServer = [],
  children,
  collectionSlugs = [],
  documents: documentsFromServer = [],
  folderID: folderIDFromServer = undefined,
  subfolders: subfoldersFromServer = [],
}: Props) {
  const { config } = useConfig()
  const { routes, serverURL } = config
  const drawerDepth = useDrawerDepth()
  const { t } = useTranslation()
  const router = useRouter()
  const { refineListData } = useListQuery()
  const { startRouteTransition } = useRouteTransition()
  const { clearRouteCache } = useRouteCache()

  const [folderCollectionConfig] = React.useState(() =>
    config.collections.find((collection) => collection.slug === config.folders.slug),
  )
  const folderCollectionSlug = folderCollectionConfig.slug

  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedIndexes, setSelectedIndexes] = React.useState<Set<number>>(() => new Set())
  const [focusedRowIndex, setFocusedRowIndex] = React.useState(-1)
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<null | number>(null)
  const [collectionUseAsTitles] = React.useState<Map<string, string>>(() => {
    const useAsTitleMap = new Map<string, string>()
    for (const collection of config.collections) {
      useAsTitleMap.set(collection.slug, collection.admin.useAsTitle || 'id')
    }
    return useAsTitleMap
  })
  const [folderIDInState, setActiveFolderID] =
    React.useState<FolderContextValue['folderID']>(undefined)
  const [breadcrumbsInState, setFolderBreadcrumbs] =
    React.useState<FolderContextValue['breadcrumbs']>(undefined)
  const [subfoldersInState, setSubfolders] =
    React.useState<GetFolderDataResult<FolderInterface>['subfolders']>(undefined)
  const [documentsInState, setDocuments] =
    React.useState<GetFolderDataResult['documents']>(undefined)
  const lastClickTime = React.useRef<null | number>(null)

  const subfolders = subfoldersInState || subfoldersFromServer
  const documents = documentsInState || documentsFromServer
  const activeFolderID = folderIDInState || folderIDFromServer
  const breadcrumbs = breadcrumbsInState || breadcrumbsFromServer

  const totalCount = subfolders.length + documents.length
  const clearSelections = React.useCallback(() => {
    setSelectedIndexes(new Set())
    setLastSelectedIndex(undefined)
  }, [])

  const setNewActiveFolderID: FolderContextValue['setFolderID'] = React.useCallback(
    async ({ folderID: toFolderID }) => {
      clearSelections()
      if (drawerDepth === 1) {
        // not in a drawer (default is 1)
        if (collectionSlugs.length === 1) {
          // looking at a single collection (collection-folders)
          startRouteTransition(() =>
            router.push(
              formatAdminURL({
                adminRoute: config.routes.admin,
                path: `/collections/${collectionSlugs[0]}/folders${toFolderID ? `/${toFolderID}` : ''}`,
              }),
            ),
          )
        } else {
          // looking at many collections (dashboard folders)
          await refineListData({
            folder: toFolderID !== breadcrumbs?.[0]?.id ? toFolderID : undefined,
          })
        }
      } else {
        // @todo in a drawer — need to update:
        // - breadcrumbs
        // - folders
        // - documents
        // how?
        // call function to get data, set in state
        setActiveFolderID(toFolderID)
      }
    },
    [
      clearSelections,
      config.routes.admin,
      drawerDepth,
      router,
      collectionSlugs,
      refineListData,
      breadcrumbs,
      startRouteTransition,
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

  const onItemKeyPress = React.useCallback(
    ({ event, index }: { event: React.KeyboardEvent; index: number }): { keyCode: string } => {
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
      return { keyCode: code }
    },
    [allowMultiSelection, lastSelectedIndex, selectedIndexes, totalCount],
  )

  const onItemClick = React.useCallback(
    ({ event, index }: { event: React.MouseEvent; index: number }): { doubleClicked: boolean } => {
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
      return { doubleClicked }
    },
    [selectedIndexes, lastSelectedIndex, allowMultiSelection],
  )

  /**
   * Remove multiple documents or folders from a folder
   *
   * This deletes folders, but only unassociates documents from folders
   */
  const removeItems: FolderContextValue['removeItems'] = React.useCallback(
    async (itemsToDelete) => {
      if (!itemsToDelete.length) {
        return
      }

      const groupedByRelationTo = itemsToDelete.reduce(
        (acc, item) => {
          if (!acc[item.relationTo]) {
            acc[item.relationTo] = []
          }
          acc[item.relationTo].push(extractID(item.value))

          return acc
        },
        {} as Record<string, (number | string)[]>,
      )

      let shouldRefreshData = false

      for (const [relationSlug, ids] of Object.entries(groupedByRelationTo)) {
        const res = await fetch(
          `${serverURL}${routes.api}/${relationSlug}${qs.stringify(
            {
              where: {
                id: {
                  in: ids,
                },
              },
            },
            {
              addQueryPrefix: true,
            },
          )}`,
          {
            body:
              relationSlug === folderCollectionSlug
                ? undefined
                : JSON.stringify({ _parentFolder: null }),
            credentials: 'include',
            headers: {
              'content-type': 'application/json',
            },
            method: relationSlug === folderCollectionSlug ? 'DELETE' : 'PATCH',
          },
        )

        if (res.status === 200) {
          shouldRefreshData = true
        }
      }

      if (shouldRefreshData) {
        clearSelections()
        clearRouteCache()
      }

      toast.success(t('general:deletedSuccessfully'))
    },
    [routes.api, serverURL, t, clearRouteCache, clearSelections, folderCollectionSlug],
  )

  const deleteCurrentFolder = React.useCallback(async () => {
    if (!activeFolderID) {
      return
    }
    return fetch(`${serverURL}${routes.api}/${folderCollectionSlug}/${activeFolderID}`, {
      credentials: 'include',
      method: 'DELETE',
    })
  }, [activeFolderID, routes.api, serverURL, folderCollectionSlug])

  const moveToFolder: FolderContextValue['moveToFolder'] = React.useCallback(
    async (args) => {
      const { itemsToMove, toFolderID } = args
      if (!itemsToMove.length) {
        return
      }

      const groupedByRelationTo = itemsToMove.reduce(
        (acc, item) => {
          if (!acc[item.relationTo]) {
            acc[item.relationTo] = []
          }
          if (item.value) {
            const itemID =
              typeof item.value === 'string' || typeof item.value === 'number'
                ? item.value
                : item.value.id
            if (itemID) {
              acc[item.relationTo].push(itemID)
            }
          }

          return acc
        },
        {} as Record<string, (number | string)[]>,
      )

      const toastID = toast.loading(
        t('general:movingCount', {
          count: itemsToMove.length,
          label: itemsToMove.length === 1 ? t('general:item') : t('general:items'),
        }),
      )

      for (const [relationSlug, ids] of Object.entries(groupedByRelationTo)) {
        const query = qs.stringify(
          {
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
          await fetch(`${serverURL}${routes.api}/${relationSlug}${query}`, {
            body: JSON.stringify({ _parentFolder: toFolderID || null }),
            credentials: 'include',
            headers: {
              'content-type': 'application/json',
            },
            method: 'PATCH',
          })
          continue
        } catch (error) {
          toast.error(t('general:error'))
          continue
        }
      }

      clearSelections()
      clearRouteCache()
      toast.success(t('general:success'), { id: toastID })
    },
    [t, clearSelections, clearRouteCache, serverURL, routes.api],
  )

  return (
    <Context
      value={{
        breadcrumbs,
        clearSelections,
        collectionUseAsTitles,
        currentFolder: breadcrumbs ? breadcrumbs[breadcrumbs.length - 1] : null,
        deleteCurrentFolder,
        documents,
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
        selectedIndexes,
        setBreadcrumbs: setFolderBreadcrumbs,
        setDocuments,
        setFocusedRowIndex,
        setFolderID: setNewActiveFolderID,
        setIsDragging,
        setSubfolders,
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
