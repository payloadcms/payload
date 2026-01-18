'use client'
import type { CollectionSlug, ListQuery } from '@ruya.sa/payload'

import { useModal } from '@faceless-ui/modal'
import { hoistQueryParamsToAnd } from '@ruya.sa/payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import type { ListDrawerContextProps, ListDrawerContextType } from '../ListDrawer/Provider.js'
import type {
  ListDrawerProps,
  RenderListServerFnArgs,
  RenderListServerFnReturnType,
} from './types.js'

import { useDocumentDrawer } from '../../elements/DocumentDrawer/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useConfig } from '../../providers/Config/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { ListDrawerContextProvider } from '../ListDrawer/Provider.js'
import { LoadingOverlay } from '../Loading/index.js'
import { type Option } from '../ReactSelect/index.js'

export const ListDrawerContent: React.FC<ListDrawerProps> = ({
  allowCreate = true,
  collectionSlugs,
  disableQueryPresets,
  drawerSlug,
  enableRowSelections,
  filterOptions,
  onBulkSelect,
  onSelect,
  overrideEntityVisibility = true,
  selectedCollection: collectionSlugFromProps,
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
    const initialSelection = collectionSlugFromProps || enabledCollections[0]?.slug
    const found = getEntityConfig({ collectionSlug: initialSelection })

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

  const updateSelectedOption = useEffectEvent((collectionSlug: CollectionSlug) => {
    if (collectionSlug && collectionSlug !== selectedOption?.value) {
      setSelectedOption({
        label: getEntityConfig({ collectionSlug })?.labels,
        value: collectionSlug,
      })
    }
  })

  useEffect(() => {
    updateSelectedOption(collectionSlugFromProps)
  }, [collectionSlugFromProps])

  /**
   * This performs a full server round trip to get the list view for the selected collection.
   * On the server, the data is freshly queried for the list view and all components are fully rendered.
   * This work includes building column state, rendering custom components, etc.
   */
  const refresh = useCallback(
    async ({ slug, query }: { query?: ListQuery; slug: string }) => {
      try {
        const newQuery: ListQuery = { ...(query || {}), where: { ...(query?.where || {}) } }

        const filterOption = filterOptions?.[slug]

        if (filterOptions && typeof filterOption !== 'boolean') {
          newQuery.where = hoistQueryParamsToAnd(newQuery.where, filterOption)
        }

        if (slug) {
          const result: RenderListServerFnReturnType = (await serverFunction({
            name: 'render-list',
            args: {
              collectionSlug: slug,
              disableBulkDelete: true,
              disableBulkEdit: true,
              disableQueryPresets,
              drawerSlug,
              enableRowSelections,
              overrideEntityVisibility,
              query: newQuery,
            } satisfies RenderListServerFnArgs,
          })) as RenderListServerFnReturnType

          setListView(result?.List || null)
        } else {
          setListView(null)
        }
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
      disableQueryPresets,
    ],
  )

  useEffect(() => {
    if (!ListView) {
      void refresh({ slug: selectedOption?.value })
    }
  }, [refresh, ListView, selectedOption.value])

  const onCreateNew = useCallback(
    ({ doc }) => {
      if (typeof onSelect === 'function') {
        onSelect({
          collectionSlug: selectedOption?.value,
          doc,
          docID: doc.id,
        })
      }

      closeModal(documentDrawerSlug)
      closeModal(drawerSlug)
    },
    [closeModal, documentDrawerSlug, drawerSlug, onSelect, selectedOption.value],
  )

  const onQueryChange: ListDrawerContextProps['onQueryChange'] = useCallback(
    (query) => {
      void refresh({ slug: selectedOption?.value, query })
    },
    [refresh, selectedOption.value],
  )

  const setMySelectedOption: ListDrawerContextProps['setSelectedOption'] = useCallback(
    (incomingSelection) => {
      setSelectedOption(incomingSelection)
      void refresh({ slug: incomingSelection?.value })
    },
    [refresh],
  )

  const refreshSelf: ListDrawerContextType['refresh'] = useCallback(
    async (incomingCollectionSlug) => {
      if (incomingCollectionSlug) {
        setSelectedOption({
          label: getEntityConfig({ collectionSlug: incomingCollectionSlug })?.labels,
          value: incomingCollectionSlug,
        })
      }

      await refresh({ slug: selectedOption.value || incomingCollectionSlug })
    },
    [getEntityConfig, refresh, selectedOption.value],
  )

  if (isLoading) {
    return <LoadingOverlay />
  }

  return (
    <ListDrawerContextProvider
      allowCreate={allowCreate}
      createNewDrawerSlug={documentDrawerSlug}
      DocumentDrawerToggler={DocumentDrawerToggler}
      drawerSlug={drawerSlug}
      enabledCollections={collectionSlugs}
      onBulkSelect={onBulkSelect}
      onQueryChange={onQueryChange}
      onSelect={onSelect}
      refresh={refreshSelf}
      selectedOption={selectedOption}
      setSelectedOption={setMySelectedOption}
    >
      {ListView}
      <DocumentDrawer onSave={onCreateNew} />
    </ListDrawerContextProvider>
  )
}
