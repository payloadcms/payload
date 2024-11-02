'use client'
import type { ClientCollectionConfig, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useState } from 'react'

import type { ListQuery } from '../../providers/ListQuery/index.js'
import type { ListDrawerProps } from './types.js'

import { useDocumentDrawer } from '../../elements/DocumentDrawer/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { ListDrawerContextProvider } from '../ListDrawer/Provider.js'
import { LoadingOverlay } from '../Loading/index.js'
import { type Option } from '../ReactSelect/index.js'

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
  const { closeModal, isModalOpen } = useModal()

  const { serverFunction } = useServerFunctions()
  const [ListView, setListView] = useState<React.ReactNode>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  const {
    config: { collections },
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

  const renderList = useCallback(
    async (slug: string, query?: ListQuery) => {
      try {
        const { List: ViewResult } = (await serverFunction({
          name: 'render-list',
          args: {
            collectionSlug: slug,
            disableBulkDelete: true,
            disableBulkEdit: true,
            drawerSlug,
            enableRowSelections,
            query,
          },
        })) as { List: React.ReactNode }

        setListView(ViewResult)
        setIsLoading(false)
      } catch (_err) {
        if (isOpen) {
          closeModal(drawerSlug)
        }
      }
    },
    [serverFunction, closeModal, drawerSlug, isOpen, enableRowSelections],
  )

  useEffect(() => {
    if (!ListView) {
      void renderList(selectedOption.value)
    }
  }, [renderList, ListView, selectedOption.value])

  const onCreateNew = useCallback(
    ({ doc }) => {
      if (typeof onSelect === 'function') {
        onSelect({
          collectionSlug: selectedOption.value,
          docID: doc.id,
        })
      }

      closeModal(documentDrawerSlug)
      closeModal(drawerSlug)
    },
    [closeModal, documentDrawerSlug, drawerSlug, onSelect, selectedOption.value],
  )

  const onQueryChange = useCallback(
    (query: ListQuery) => {
      void renderList(selectedOption.value, query)
    },
    [renderList, selectedOption.value],
  )

  const setMySelectedOption = useCallback(
    (incomingSelection: Option<string>) => {
      setSelectedOption(incomingSelection)
      void renderList(incomingSelection.value)
    },
    [renderList],
  )

  if (isLoading) {
    return <LoadingOverlay />
  }

  return (
    <EditDepthProvider>
      <ListDrawerContextProvider
        createNewDrawerSlug={documentDrawerSlug}
        drawerSlug={drawerSlug}
        enabledCollections={collectionSlugs}
        onBulkSelect={onBulkSelect}
        onQueryChange={onQueryChange}
        onSelect={onSelect}
        selectedOption={selectedOption}
        setSelectedOption={setMySelectedOption}
      >
        {ListView}
        <DocumentDrawer onSave={onCreateNew} />
      </ListDrawerContextProvider>
    </EditDepthProvider>
  )
}
