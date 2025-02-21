'use client'
import type { PaginatedDocs } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
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
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { useConfig } from '../Config/index.js'
import { useTranslation } from '../Translation/index.js'

export type FileCardData = {
  filename: string
  id: number | string
  mimeType: string
  name: string
  url: string
}

export type FolderContextValue = {
  breadcrumbs?: FolderBreadcrumb[]
  collectionUseAsTitles: Map<string, string>
  currentFolder?: FolderInterface
  deleteCurrentFolder: () => Promise<Response>
  documents?: GetFolderDataResult['items']
  folderCollectionSlug: string
  folderID?: number | string
  getSelectedItems?: () => PolymorphicRelationshipValue[]
  isRootFolder?: boolean
  lastSelectedIndex?: number
  moveToFolder: (args: {
    itemsToMove: PolymorphicRelationshipValue[]
    toFolderID?: number | string
  }) => Promise<void>
  populateFolderData: (args: { folderID: number | string }) => Promise<void>
  removeItems: (args: PolymorphicRelationshipValue[]) => Promise<void>
  selectedIndexes: Set<number>
  setBreadcrumbs: React.Dispatch<React.SetStateAction<FolderBreadcrumb[]>>
  setFolderID: (args: { folderID: number | string }) => Promise<void>
  setLastSelectedIndex: React.Dispatch<React.SetStateAction<null | number>>
  setSelectedIndexes: React.Dispatch<React.SetStateAction<Set<number>>>
  setSubfolders: React.Dispatch<React.SetStateAction<GetFolderDataResult['items']>>
  subfolders?: GetFolderDataResult<FolderInterface>['items']
}

const Context = React.createContext<FolderContextValue>({
  breadcrumbs: [],
  collectionUseAsTitles: new Map(),
  currentFolder: undefined,
  deleteCurrentFolder: () => Promise.resolve(undefined),
  documents: [],
  folderCollectionSlug: '',
  folderID: undefined,
  getSelectedItems: () => [],
  isRootFolder: undefined,
  lastSelectedIndex: undefined,
  moveToFolder: () => Promise.resolve(undefined),
  populateFolderData: () => Promise.resolve(undefined),
  removeItems: () => Promise.resolve(undefined),
  selectedIndexes: new Set(),
  setBreadcrumbs: () => {},
  setFolderID: () => Promise.resolve(undefined),
  setLastSelectedIndex: () => {},
  setSelectedIndexes: () => {},
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
  readonly children: React.ReactNode
  readonly initialData?: FolderProviderData
}
export function FolderProvider({ children, initialData }: Props) {
  const { config } = useConfig()
  const { routes, serverURL } = config
  const [selectedIndexes, setSelectedIndexes] = React.useState<Set<number>>(() => new Set())
  const searchParams = useSearchParams()
  const drawerDepth = useDrawerDepth()
  const router = useRouter()
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
  const [collectionUseAsTitles] = React.useState<Map<string, string>>(() => {
    const useAsTitleMap = new Map<string, string>()
    for (const collection of config.collections) {
      useAsTitleMap.set(collection.slug, collection.admin.useAsTitle || 'id')
    }
    return useAsTitleMap
  })
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<null | number>()

  const isRootFolder = React.useMemo(() => {
    return folderBreadcrumbs.length === 1
  }, [folderBreadcrumbs])

  const clearSelections = React.useCallback(() => {
    setSelectedIndexes(new Set())
    setLastSelectedIndex(undefined)
  }, [])

  const populateFolderData = React.useCallback(
    async ({ folderID: folderToPopulate }) => {
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
      } else {
        setFolderBreadcrumbs([])
        setSubfolders([])
        setDocuments([])
      }
    },
    [routes.api, serverURL, searchParams],
  )

  const setNewActiveFolderID: FolderContextValue['setFolderID'] = React.useCallback(
    async ({ folderID: toFolderID }) => {
      clearSelections()
      setActiveFolderID(toFolderID)
      if (drawerDepth === 1) {
        router.push(
          `${routes.admin}${toFolderID !== folderBreadcrumbs[0].id ? `?folder=${toFolderID}` : ''}`,
        )
      } else {
        await populateFolderData({ folderID: toFolderID })
      }
    },
    [drawerDepth, router, routes.admin, populateFolderData, folderBreadcrumbs, clearSelections],
  )

  const getSelectedItems = React.useCallback(() => {
    const allItems = [...subfolders, ...documents]
    return Array.from(selectedIndexes).map((index) => allItems[index])
  }, [documents, selectedIndexes, subfolders])

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

      toast.success(t('general:success'))

      const isMovingCurrentFolder = itemsToMove.some(
        (item) => item.relationTo === folderCollectionSlug && extractID(item.value) === toFolderID,
      )
      clearSelections()

      await populateFolderData({
        folderID: isMovingCurrentFolder ? toFolderID : activeFolderID,
      })
    },
    [
      routes.api,
      serverURL,
      t,
      setDocuments,
      setSubfolders,
      populateFolderData,
      activeFolderID,
      clearSelections,
    ],
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
      setSelectedIndexes(new Set())
    }
  }, [initialData])

  React.useEffect(() => {
    if (!initialData) {
      void populateFolderData({ folderID: activeFolderID })
    }
  }, [initialData, activeFolderID, populateFolderData])

  return (
    <Context.Provider
      value={{
        breadcrumbs: folderBreadcrumbs,
        collectionUseAsTitles,
        currentFolder: folderBreadcrumbs[folderBreadcrumbs.length - 1],
        deleteCurrentFolder,
        documents,
        folderCollectionSlug,
        folderID: activeFolderID,
        getSelectedItems,
        isRootFolder,
        lastSelectedIndex,
        moveToFolder,
        populateFolderData,
        removeItems,
        selectedIndexes,
        setBreadcrumbs: setFolderBreadcrumbs,
        setFolderID: setNewActiveFolderID,
        setLastSelectedIndex,
        setSelectedIndexes,
        setSubfolders,
        subfolders,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useFolder(): FolderContextValue {
  const context = React.useContext(Context)

  if (context === undefined) {
    throw new Error('useFolder must be used within a FolderProvider')
  }

  return context
}
