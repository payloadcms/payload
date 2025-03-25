'use client'
import type { PaginatedDocs } from 'payload'

import { useSearchParams } from 'next/navigation.js'
import {
  extractID,
  type FolderBreadcrumb,
  type FolderInterface,
  type GetFolderDataResult,
} from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'
import { toast } from 'sonner'

import type { PolymorphicRelationshipValue } from '../../elements/FolderView/types.js'

import { useDrawerDepth } from '../../elements/Drawer/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { useConfig } from '../Config/index.js'
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
  documents?: GetFolderDataResult['items']
  focusedRowIndex: number
  folderCollectionSlug: string
  folderID?: number | string
  getSelectedItems?: () => PolymorphicRelationshipValue[]
  hasMoreDocuments: boolean
  moveToFolder: (args: {
    itemsToMove: PolymorphicRelationshipValue[]
    toFolderID?: number | string
  }) => Promise<void>
  onItemClick: (args: {
    event: React.MouseEvent
    index: number
  }) => Promise<{ doubleClicked: boolean }>
  onItemKeyPress: (args: {
    event: React.KeyboardEvent
    index: number
  }) => Promise<{ keyCode: string }>
  populateFolderData: (args: { folderID: number | string }) => Promise<void>
  removeItems: (args: PolymorphicRelationshipValue[]) => Promise<void>
  selectedIndexes: Set<number>
  setBreadcrumbs: React.Dispatch<React.SetStateAction<FolderBreadcrumb[]>>
  setFolderID: (args: { folderID: number | string }) => Promise<void>
  setSubfolders: React.Dispatch<React.SetStateAction<GetFolderDataResult['items']>>
  subfolders?: GetFolderDataResult<FolderInterface>['items']
}

const Context = React.createContext<FolderContextValue>({
  breadcrumbs: [],
  clearSelections: () => {},
  collectionUseAsTitles: new Map(),
  currentFolder: null,
  deleteCurrentFolder: () => Promise.resolve(undefined),
  documents: [],
  focusedRowIndex: -1,
  folderCollectionSlug: '',
  folderID: undefined,
  getSelectedItems: () => [],
  hasMoreDocuments: true,
  moveToFolder: () => Promise.resolve(undefined),
  onItemClick: () => Promise.resolve({ doubleClicked: false }),
  onItemKeyPress: () => Promise.resolve({ keyCode: '' }),
  populateFolderData: () => Promise.resolve(undefined),
  removeItems: () => Promise.resolve(undefined),
  selectedIndexes: new Set(),
  setBreadcrumbs: () => {},
  setFolderID: () => Promise.resolve(undefined),
  setSubfolders: () => {},
  subfolders: [],
})

export type FolderProviderData = {
  documents?: PaginatedDocs[]
  folderID?: number | string
  subfolders?: FolderInterface[]
} & GetFolderDataResult
const folderCollectionSlug = '_folders'
type Props = {
  readonly allowMultiSelection?: boolean
  readonly children: React.ReactNode
  readonly initialData?: FolderProviderData
}
export function FolderProvider({ allowMultiSelection = true, children, initialData }: Props) {
  const { config } = useConfig()
  const { routes, serverURL } = config
  const searchParams = useSearchParams()
  const drawerDepth = useDrawerDepth()
  const { refineListData } = useListQuery()
  const { t } = useTranslation()

  const [activeFolderID, setActiveFolderID] = React.useState<FolderContextValue['folderID']>(
    initialData?.folderID,
  )
  const [folderBreadcrumbs, setFolderBreadcrumbs] = React.useState<
    FolderContextValue['breadcrumbs']
  >(initialData?.breadcrumbs || [])
  const [subfolders, setSubfolders] = React.useState<GetFolderDataResult<FolderInterface>['items']>(
    (initialData?.items.filter((item) => item.relationTo === folderCollectionSlug) ||
      []) as GetFolderDataResult<FolderInterface>['items'],
  )
  const [documents, setDocuments] = React.useState<GetFolderDataResult['items']>(
    initialData?.items.filter((item) => item.relationTo !== folderCollectionSlug) || [],
  )
  const [selectedIndexes, setSelectedIndexes] = React.useState<Set<number>>(() => new Set())
  const [focusedRowIndex, setFocusedRowIndex] = React.useState(-1)
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<null | number>(null)
  const lastClickTime = React.useRef<null | number>(null)
  const [collectionUseAsTitles] = React.useState<Map<string, string>>(() => {
    const useAsTitleMap = new Map<string, string>()
    for (const collection of config.collections) {
      useAsTitleMap.set(collection.slug, collection.admin.useAsTitle || 'id')
    }
    return useAsTitleMap
  })
  const [hasMoreDocuments, setHasMoreDocuments] = React.useState(() =>
    Boolean(initialData?.hasMoreDocuments),
  )

  const totalCount = subfolders.length + documents.length
  const clearSelections = React.useCallback(() => {
    setSelectedIndexes(new Set())
    setLastSelectedIndex(undefined)
  }, [])

  const populateFolderData = React.useCallback(
    async ({ folderID: folderToPopulate }: { folderID: number | string }) => {
      // when in a drawer, you cannot rely on the server rendered data
      const queryParams = qs.stringify(
        {
          ...parseSearchParams(searchParams),
          folderID: folderToPopulate,
        },
        { addQueryPrefix: true },
      )
      const folderDataReq = await fetch(
        `${serverURL}${routes.api}/${folderCollectionSlug}/populate-folder-data${queryParams}`,
        {
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
        },
      )

      if (folderDataReq.status === 200) {
        const folderDataRes: GetFolderDataResult = await folderDataReq.json()
        if (folderDataRes.breadcrumbs) {
          setFolderBreadcrumbs(folderDataRes.breadcrumbs)
        }

        if (folderDataRes.items) {
          setSubfolders(
            folderDataRes.items.filter(
              (item) => item.relationTo === folderCollectionSlug,
            ) as GetFolderDataResult<FolderInterface>['items'],
          )
          setDocuments(
            folderDataRes.items.filter((item) => item.relationTo !== folderCollectionSlug),
          )
        }

        setHasMoreDocuments(folderDataRes.hasMoreDocuments)
      } else {
        setFolderBreadcrumbs([])
        setSubfolders([])
        setDocuments([])
        setHasMoreDocuments(false)
      }
    },
    [routes.api, serverURL, searchParams],
  )

  const setNewActiveFolderID: FolderContextValue['setFolderID'] = React.useCallback(
    async ({ folderID: toFolderID }) => {
      clearSelections()
      setActiveFolderID(toFolderID)
      // not in a drawer (confusing default of 1)
      if (drawerDepth === 1) {
        await refineListData({
          folder: toFolderID !== folderBreadcrumbs?.[0]?.id ? toFolderID : undefined,
        })
      } else {
        await populateFolderData({ folderID: toFolderID })
      }
    },
    [clearSelections, drawerDepth, populateFolderData, refineListData, folderBreadcrumbs],
  )

  const getSelectedItems = React.useCallback(() => {
    const allItems = [...subfolders, ...documents]
    return Array.from(selectedIndexes).map((index) => allItems[index])
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

      let folderIDsToFilterOut: (number | string)[] = []
      const docsToFilterOut: GetFolderDataResult['items'] = []

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
        const res = await fetch(`${serverURL}${routes.api}/${relationSlug}${query}`, {
          body:
            relationSlug === folderCollectionSlug
              ? undefined
              : JSON.stringify({ _parentFolder: null }),
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
          method: relationSlug === folderCollectionSlug ? 'DELETE' : 'PATCH',
        })

        if (res.status === 200) {
          if (relationSlug === folderCollectionSlug) {
            folderIDsToFilterOut = ids
          } else {
            docsToFilterOut.push(
              ...ids.map((id) => ({
                relationTo: relationSlug,
                value: id,
              })),
            )
          }
        }
      }

      if (docsToFilterOut.length) {
        setDocuments((prevDocs) =>
          prevDocs.filter(({ relationTo, value }) => {
            return !docsToFilterOut.some(
              (doc) => doc.relationTo === relationTo && doc.value === value,
            )
          }),
        )
      }
      if (folderIDsToFilterOut.length) {
        setSubfolders((prevFolders) =>
          prevFolders.filter(({ value }) => {
            const valueID = typeof value === 'object' ? value.id : value
            return !folderIDsToFilterOut.includes(valueID)
          }),
        )
      }

      if (docsToFilterOut.length || folderIDsToFilterOut.length) {
        await populateFolderData({ folderID: activeFolderID })
      }

      toast.success(t('general:deletedSuccessfully'))
    },
    [routes.api, serverURL, t, activeFolderID, populateFolderData],
  )

  const deleteCurrentFolder = React.useCallback(async () => {
    if (!activeFolderID) {
      return
    }
    return fetch(`${serverURL}${routes.api}/${folderCollectionSlug}/${activeFolderID}`, {
      credentials: 'include',
      method: 'DELETE',
    })
  }, [activeFolderID, routes.api, serverURL])

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

      let folderIDsToFilterOut: (number | string)[] = []
      const docsToFilterOut: GetFolderDataResult['items'] = []

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
          const res = await fetch(`${serverURL}${routes.api}/${relationSlug}${query}`, {
            body: JSON.stringify({ _parentFolder: toFolderID || null }),
            credentials: 'include',
            headers: {
              'content-type': 'application/json',
            },
            method: 'PATCH',
          })

          if (res.status === 200) {
            if (relationSlug === folderCollectionSlug) {
              folderIDsToFilterOut = ids
            } else {
              docsToFilterOut.push(
                ...ids.map((id) => ({
                  relationTo: relationSlug,
                  value: id,
                })),
              )
            }
          }
        } catch (error) {
          toast.error(t('general:error'))
          return
        }
      }

      toast.success(t('general:success'), { id: toastID })

      if (docsToFilterOut.length) {
        setDocuments((prevDocs) =>
          prevDocs.filter(({ relationTo, value }) => {
            return !docsToFilterOut.some(
              (doc) => doc.relationTo === relationTo && doc.value === value,
            )
          }),
        )
      }
      if (folderIDsToFilterOut.length) {
        setSubfolders((prevFolders) =>
          prevFolders.filter(({ value }) => {
            const valueID = typeof value === 'object' ? value.id : value
            return !folderIDsToFilterOut.includes(valueID)
          }),
        )
      }

      const isMovingCurrentFolder = itemsToMove.some(
        (item) => item.relationTo === folderCollectionSlug && extractID(item.value) === toFolderID,
      )
      clearSelections()

      await populateFolderData({
        folderID: isMovingCurrentFolder ? toFolderID : activeFolderID,
      })
    },
    [t, clearSelections, populateFolderData, activeFolderID, serverURL, routes.api],
  )

  React.useEffect(() => {
    if (initialData) {
      setSubfolders(
        (initialData?.items.filter((item) => item.relationTo === folderCollectionSlug) ||
          []) as GetFolderDataResult<FolderInterface>['items'],
      )
      setDocuments(
        initialData?.items.filter((item) => item.relationTo !== folderCollectionSlug) || [],
      )
      setFolderBreadcrumbs(initialData?.breadcrumbs || [])
      clearSelections()
    }
  }, [initialData, clearSelections])

  React.useEffect(() => {
    if (!initialData) {
      void populateFolderData({ folderID: activeFolderID })
    }
  }, [initialData, activeFolderID, populateFolderData])

  return (
    <Context
      value={{
        breadcrumbs: folderBreadcrumbs,
        clearSelections,
        collectionUseAsTitles,
        currentFolder: folderBreadcrumbs ? folderBreadcrumbs[folderBreadcrumbs.length - 1] : null,
        deleteCurrentFolder,
        documents,
        focusedRowIndex,
        folderCollectionSlug,
        folderID: activeFolderID,
        getSelectedItems,
        hasMoreDocuments,
        moveToFolder,
        onItemClick,
        onItemKeyPress,
        populateFolderData,
        removeItems,
        selectedIndexes,
        setBreadcrumbs: setFolderBreadcrumbs,
        setFolderID: setNewActiveFolderID,
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
