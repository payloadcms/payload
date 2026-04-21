'use client'
import type { CollectionSlug, ListQuery } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { hoistQueryParamsToAnd } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import type { RenderListDataOnlyResult } from '../../utilities/dataOnlyHandlers/renderList.js'
import type { ListDrawerContextProps, ListDrawerContextType } from '../ListDrawer/Provider.js'
import type {
  ListDrawerProps,
  RenderListServerFnArgs,
  RenderListServerFnReturnType,
} from './types.js'

import { useDocumentDrawer } from '../../elements/DocumentDrawer/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useImportMap } from '../../providers/ImportMap/index.js'
import { ListQueryProvider } from '../../providers/ListQuery/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { renderFilters, renderTable } from '../../utilities/renderTable.js'
import { buildListViewClientProps } from '../../views/List/buildListViewClientProps.js'
import { DefaultListView } from '../../views/List/index.js'
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
    config,
    config: { collections },
    getEntityConfig,
  } = useConfig()
  const importMap = useImportMap()
  const { permissions } = useAuth()
  const { i18n } = useTranslation()

  const isOpen = isModalOpen(drawerSlug)

  const enabledCollections = collections.filter(({ slug }) => {
    return collectionSlugs.includes(slug)
  })

  const getCollectionOption = useCallback(
    (collectionSlug?: CollectionSlug) => {
      if (!collectionSlug) {
        return undefined
      }

      const found = getEntityConfig({ collectionSlug })

      return {
        label: found?.labels || collectionSlug,
        value: collectionSlug,
      }
    },
    [getEntityConfig],
  )

  const [selectedOption, setSelectedOption] = useState<Option<string>>(() => {
    const initialSelection =
      collectionSlugFromProps || enabledCollections[0]?.slug || collectionSlugs[0]
    return getCollectionOption(initialSelection)
  })

  const [DocumentDrawer, DocumentDrawerToggler, { drawerSlug: documentDrawerSlug }] =
    useDocumentDrawer({
      collectionSlug: selectedOption.value,
    })

  const updateSelectedOption = useEffectEvent((collectionSlug: CollectionSlug) => {
    if (collectionSlug && collectionSlug !== selectedOption?.value) {
      setSelectedOption(getCollectionOption(collectionSlug))
    }
  })

  useEffect(() => {
    updateSelectedOption(collectionSlugFromProps)
  }, [collectionSlugFromProps])

  const refresh = useCallback(
    async ({ slug, query }: { query?: ListQuery; slug: string }) => {
      try {
        const newQuery: ListQuery = { ...(query || {}), where: { ...(query?.where || {}) } }

        const filterOption = filterOptions?.[slug]

        if (filterOptions && typeof filterOption !== 'boolean') {
          newQuery.where = hoistQueryParamsToAnd(newQuery.where, filterOption)
        }

        if (slug) {
          const result = (await serverFunction({
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
          })) as RenderListDataOnlyResult | RenderListServerFnReturnType

          if ('List' in result && result?.List) {
            setListView(result.List)
          } else if ('listViewData' in result && result?.listViewData && importMap) {
            const listData = result.listViewData

            const listViewClientProps = buildListViewClientProps({
              clientConfig: config,
              data: listData,
              i18n,
              importMap,
              permissions,
              renderFilters,
              renderTable,
            })

            setListView(
              <ListQueryProvider
                collectionSlug={listData.collectionSlug}
                data={listData.data}
                modifySearchParams={!listData.isInDrawer}
                orderableFieldName={listData.orderableFieldName}
                query={listData.query}
              >
                <DefaultListView {...listViewClientProps} />
              </ListQueryProvider>,
            )
          } else {
            setListView(null)
          }
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
      config,
      drawerSlug,
      isOpen,
      enableRowSelections,
      filterOptions,
      i18n,
      importMap,
      overrideEntityVisibility,
      disableQueryPresets,
      permissions,
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
        setSelectedOption(getCollectionOption(incomingCollectionSlug))
      }

      await refresh({ slug: selectedOption.value || incomingCollectionSlug })
    },
    [getCollectionOption, refresh, selectedOption.value],
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
