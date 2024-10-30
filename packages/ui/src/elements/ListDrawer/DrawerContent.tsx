'use client'
import type { ClientCollectionConfig, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { ListDrawerProps } from './types.js'

import { useDocumentDrawer } from '../../elements/DocumentDrawer/index.js'
import { useThrottledEffect } from '../../hooks/useThrottledEffect.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { LoadingOverlay } from '../Loading/index.js'
import { type Option } from '../ReactSelect/index.js'
import { ListDrawerContextProvider } from './Provider.js'

export const hoistQueryParamsToAnd = (where: Where, queryParams: Where) => {
  if ('and' in where) {
    where.and.push(queryParams)
  } else if ('or' in where) {
    where = {
      and: [where, queryParams],
    }
  } else {
    where = {
      and: [where, queryParams],
    }
  }

  return where
}

export const ListDrawerContent: React.FC<ListDrawerProps> = ({
  allowCreate = true,
  collectionSlugs,
  drawerSlug,
  enableRowSelections,
  filterOptions,
  onBulkSelect,
  onSelect,
  selectedCollection: selectedCollectionFromProps,
}) => {
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()
  const { getPreference, setPreference } = usePreferences()
  const { closeModal, isModalOpen } = useModal()
  const [limit, setLimit] = useState<number>()
  // Track the page limit so we can reset the page number when it changes
  const previousLimit = useRef<number>(limit || null)
  const [sort, setSort] = useState<string>(null)
  const [page, setPage] = useState<number>(1)
  const [where, setWhere] = useState<Where>(null)
  const [search, setSearch] = useState<string>('')
  const [showLoadingOverlay, setShowLoadingOverlay] = useState<boolean>(true)

  const { serverFunction } = useServerFunctions()
  const [ListView, setListView] = useState<React.ReactNode>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  const params = {
    limit,
    page,
    search,
    sort,
    where,
  }

  const {
    config: {
      collections,
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const isOpen = isModalOpen(drawerSlug)

  const enabledCollections = collections.filter(({ slug }) => {
    return collectionSlugs.includes(slug)
  })

  const [selectedOption, setSelectedOption] = useState<Option<string>>(() => {
    const initialSelection = selectedCollectionFromProps || enabledCollections[0]?.slug
    const found = getEntityConfig({ collectionSlug: initialSelection }) as ClientCollectionConfig

    return found
      ? {
          label: found.labels,
          value: found.slug,
        }
      : undefined
  })

  const [DocumentDrawer, , { drawerSlug: documentDrawerSlug }] = useDocumentDrawer({
    collectionSlug: selectedOption.value,
  })

  useEffect(() => {
    if (selectedCollectionFromProps && selectedCollectionFromProps !== selectedOption?.value) {
      setSelectedOption({
        label: collections.find(({ slug }) => slug === selectedCollectionFromProps).labels,
        value: selectedCollectionFromProps,
      })
    }
  }, [selectedCollectionFromProps, collections, selectedOption])

  useEffect(() => {
    if (!ListView) {
      const getListView = async () => {
        try {
          const { List: ViewResult } = (await serverFunction({
            name: 'render-list',
            args: {
              collectionSlug: selectedOption.value,
              disableBulkDelete: true,
              disableBulkEdit: true,
              documentDrawerSlug,
              drawerSlug,
              enableRowSelections,
            },
          })) as { docID: string; List: React.ReactNode }

          setListView(ViewResult)
          setIsLoading(false)
        } catch (_err) {
          if (isOpen) {
            closeModal(drawerSlug)
          }
        }
      }

      void getListView()
    }
  }, [
    serverFunction,
    ListView,
    closeModal,
    drawerSlug,
    isOpen,
    enableRowSelections,
    selectedOption,
    documentDrawerSlug,
  ])

  const preferencesKey = selectedOption.value ? `${selectedOption.value}-list` : null

  const collectionPermissions = permissions?.collections?.[selectedOption.value]
  const hasCreatePermission = collectionPermissions?.create?.permission && allowCreate

  const moreThanOneAvailableCollection = enabledCollections.length > 1

  // useEffect(() => {
  //   const selectedCollectionConfig = getEntityConfig({
  //     collectionSlug: selectedOption.value,
  //   }) as ClientCollectionConfig

  //   if (selectedCollectionConfig) {
  //     const {
  //       slug,
  //       admin: { listSearchableFields, useAsTitle },
  //       versions,
  //     } = selectedCollectionConfig

  //     const params: {
  //       cacheBust?: number
  //       depth?: number
  //       draft?: string
  //       limit?: number
  //       page?: number
  //       search?: string
  //       sort?: string
  //       where?: unknown
  //     } = {
  //       depth: 0,
  //     }

  //     let copyOfWhere = { ...(where || {}) }
  //     const filterOption = filterOptions?.[slug]

  //     if (filterOptions && typeof filterOption !== 'boolean') {
  //       copyOfWhere = hoistQueryParamsToAnd(copyOfWhere, filterOption)
  //     }

  //     if (search) {
  //       const searchAsConditions = (listSearchableFields || [useAsTitle]).map((fieldName) => {
  //         return {
  //           [fieldName]: {
  //             like: search,
  //           },
  //         }
  //       }, [])

  //       if (searchAsConditions.length > 0) {
  //         const searchFilter: Where = {
  //           or: [...searchAsConditions],
  //         }

  //         copyOfWhere = hoistQueryParamsToAnd(copyOfWhere, searchFilter)
  //       }
  //     }

  //     if (page) {
  //       params.page = page
  //     }

  //     if (sort) {
  //       params.sort = sort
  //     }

  //     if (cacheBust) {
  //       params.cacheBust = cacheBust
  //     }

  //     if (limit) {
  //       params.limit = limit

  //       if (limit !== previousLimit.current) {
  //         previousLimit.current = limit

  //         // Reset page if limit changes
  //         // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
  //         setPage(1)
  //       }
  //     }

  //     if (copyOfWhere) {
  //       params.where = copyOfWhere
  //     }

  //     if (versions?.drafts) {
  //       params.draft = 'true'
  //     }

  //     setParams(params)
  //   }
  // }, [
  //   page,
  //   sort,
  //   where,
  //   search,
  //   limit,
  //   cacheBust,
  //   filterOptions,
  //   collections,
  //   selectedOption,
  //   t,
  //   setParams,
  // ])

  useEffect(() => {
    const newPreferences = {
      limit,
      sort,
    }

    if (limit || sort) {
      void setPreference(preferencesKey, newPreferences, true)
    }
  }, [sort, limit, setPreference, preferencesKey])

  // Get existing preferences if they exist
  useEffect(() => {
    if (preferencesKey && !limit) {
      const getInitialPref = async () => {
        const existingPreferences = await getPreference<{ limit?: number }>(preferencesKey)

        if (existingPreferences?.limit) {
          setLimit(existingPreferences?.limit)
        }
      }
      void getInitialPref()
    }
  }, [getPreference, limit, preferencesKey])

  // useThrottledEffect(
  //   () => {
  //     if (isLoadingList) {
  //       setShowLoadingOverlay(true)
  //     }
  //   },
  //   1750,
  //   [isLoadingList, setShowLoadingOverlay],
  // )

  // useEffect(() => {
  //   if (!isLoadingList && showLoadingOverlay) {
  //     // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
  //     setShowLoadingOverlay(false)
  //   }
  // }, [isLoadingList, showLoadingOverlay])

  // if (!selectedOption.value || isError) {
  //   return <LoadingOverlay />
  // }

  const onCreateNew = useCallback(
    ({ doc }) => {
      if (typeof onSelect === 'function') {
        onSelect({
          collectionSlug: selectedOption.value,
          docID: doc.id,
        })
      }
      // dispatchCacheBust()
      closeModal(documentDrawerSlug)
      closeModal(drawerSlug)
    },
    [closeModal, documentDrawerSlug, drawerSlug, onSelect, selectedOption.value],
  )

  if (isLoading) {
    return <LoadingOverlay />
  }

  return (
    <EditDepthProvider>
      <ListDrawerContextProvider
        createNewDrawerSlug={documentDrawerSlug}
        drawerSlug={drawerSlug}
        onBulkSelect={onBulkSelect}
        onSelect={onSelect}
      >
        {ListView}
        <DocumentDrawer onSave={onCreateNew} />
      </ListDrawerContextProvider>
    </EditDepthProvider>
  )
}
