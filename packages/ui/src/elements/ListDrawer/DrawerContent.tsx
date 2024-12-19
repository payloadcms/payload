'use client'
import type { ClientCollectionConfig, ListQuery } from 'payload'

import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useState } from 'react'

import type { ListDrawerProps } from './types.js'

import { useDocumentDrawer } from '../../elements/DocumentDrawer/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { hoistQueryParamsToAnd } from '../../utilities/mergeListSearchAndWhere.js'
import { ListDrawerContextProvider } from '../ListDrawer/Provider.js'
import { LoadingOverlay } from '../Loading/index.js'
import { type Option } from '../ReactSelect/index.js'

export const ListDrawerContent: React.FC<ListDrawerProps> = ({
  allowCreate = true,
  collectionSlugs,
  drawerSlug,
  enableRowSelections,
  filterOptions,
  onBulkSelect,
  onSelect,
  overrideEntityVisibility = true,
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

  const [DocumentDrawer, DocumentDrawerToggler, { drawerSlug: documentDrawerSlug }] =
    useDocumentDrawer({
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
        const newQuery: ListQuery = { ...(query || {}), where: { ...(query?.where || {}) } }

        const filterOption = filterOptions?.[slug]

        if (filterOptions && typeof filterOption !== 'boolean') {
          newQuery.where = hoistQueryParamsToAnd(newQuery.where, filterOption)
        }

        const { List: ViewResult } = (await serverFunction({
          name: 'render-list',
          args: {
            collectionSlug: slug,
            disableBulkDelete: true,
            disableBulkEdit: true,
            drawerSlug,
            enableRowSelections,
            overrideEntityVisibility,
            query: newQuery,
          },
        })) as { List: React.ReactNode }

        setListView(ViewResult)
        setIsLoading(false)
      } catch (_err) {
        console.error('Error rendering List View: ', _err) // eslint-disable-line no-console

        if (isOpen) {
          closeModal(drawerSlug)
        }
      }
    },
    [
      serverFunction,
      closeModal,
      drawerSlug,
      isOpen,
      enableRowSelections,
      filterOptions,
      overrideEntityVisibility,
    ],
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
    <ListDrawerContextProvider
      createNewDrawerSlug={documentDrawerSlug}
      DocumentDrawerToggler={DocumentDrawerToggler}
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
  )
}
