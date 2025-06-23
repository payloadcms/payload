import { useModal } from '@faceless-ui/modal'
import React, { useCallback, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { Where } from '../../../../exports/types'
import type { Field } from '../../../../fields/config/types'
import type { ListDrawerProps } from './types'

import { baseClass } from '.'
import { getTranslation } from '../../../../utilities/getTranslation'
import usePayloadAPI from '../../../hooks/usePayloadAPI'
import { useUseTitleField } from '../../../hooks/useUseAsTitle'
import Label from '../../forms/Label'
import X from '../../icons/X'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { DocumentInfoProvider } from '../../utilities/DocumentInfo'
import { usePreferences } from '../../utilities/Preferences'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import DefaultList from '../../views/collections/List/Default'
import formatFields from '../../views/collections/List/formatFields'
import { useDocumentDrawer } from '../DocumentDrawer'
import Pill from '../Pill'
import ReactSelect from '../ReactSelect'
import { TableColumnsProvider } from '../TableColumns'
import ViewDescription from '../ViewDescription'

const hoistQueryParamsToAnd = (where: Where, queryParams: Where) => {
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
  collectionSlugs,
  customHeader,
  drawerSlug,
  filterOptions,
  onSelect,
  selectedCollection,
}) => {
  const { i18n, t } = useTranslation(['upload', 'general'])
  const { permissions } = useAuth()
  const { setPreference } = usePreferences()
  const { closeModal, isModalOpen } = useModal()
  const [limit, setLimit] = useState<number>()
  const [sort, setSort] = useState(null)
  const [page, setPage] = useState(1)
  const [where, setWhere] = useState(null)
  const [search, setSearch] = useState('')

  const {
    collections,
    routes: { api },
    serverURL,
  } = useConfig()

  const enabledCollectionConfigs = collections.filter(({ slug }) => {
    return collectionSlugs.includes(slug)
  })

  const [selectedCollectionConfig, setSelectedCollectionConfig] =
    useState<SanitizedCollectionConfig>(() => {
      return (
        enabledCollectionConfigs.find(({ slug }) => slug === selectedCollection) ||
        enabledCollectionConfigs?.[0]
      )
    })

  const [selectedOption, setSelectedOption] = useState<{ label: string; value: string }>(() =>
    selectedCollectionConfig
      ? {
          label: getTranslation(selectedCollectionConfig.labels.singular, i18n),
          value: selectedCollectionConfig.slug,
        }
      : undefined,
  )

  const [fields, setFields] = useState<Field[]>(() => formatFields(selectedCollectionConfig))

  const titleField = useUseTitleField(selectedCollectionConfig)

  useEffect(() => {
    setFields(formatFields(selectedCollectionConfig))
  }, [selectedCollectionConfig])

  // allow external control of selected collection, same as the initial state logic above
  useEffect(() => {
    if (selectedCollection) {
      // if passed a selection, find it and check if it's enabled
      const selectedConfig =
        enabledCollectionConfigs.find(({ slug }) => slug === selectedCollection) ||
        enabledCollectionConfigs?.[0]
      setSelectedCollectionConfig(selectedConfig)
    }
  }, [selectedCollection, enabledCollectionConfigs, onSelect, t])

  const preferenceKey = `${selectedCollectionConfig.slug}-list`

  // this is the 'create new' drawer
  const [DocumentDrawer, DocumentDrawerToggler, { drawerSlug: documentDrawerSlug }] =
    useDocumentDrawer({
      collectionSlug: selectedCollectionConfig.slug,
    })

  useEffect(() => {
    if (selectedOption) {
      setSelectedCollectionConfig(
        enabledCollectionConfigs.find(({ slug }) => selectedOption.value === slug),
      )
    }
  }, [selectedOption, enabledCollectionConfigs])

  const collectionPermissions = permissions?.collections?.[selectedCollectionConfig?.slug]
  const hasCreatePermission = collectionPermissions?.create?.permission

  // If modal is open, get active page of upload gallery
  const isOpen = isModalOpen(drawerSlug)
  const apiURL = isOpen ? `${serverURL}${api}/${selectedCollectionConfig.slug}` : null
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0) // used to force a re-fetch even when apiURL is unchanged
  const [{ data, isError }, { setParams }] = usePayloadAPI(apiURL, {})
  const moreThanOneAvailableCollection = enabledCollectionConfigs.length > 1

  useEffect(() => {
    const { slug, admin: { listSearchableFields } = {}, versions } = selectedCollectionConfig
    const params: {
      cacheBust?: number
      draft?: string
      limit?: number
      page?: number
      search?: string
      sort?: string
      where?: unknown
    } = {}

    let copyOfWhere = { ...(where || {}) }
    const filterOption = filterOptions?.[slug]

    if (filterOptions && typeof filterOption !== 'boolean') {
      copyOfWhere = hoistQueryParamsToAnd(copyOfWhere, filterOption)
    }

    if (search) {
      const searchAsConditions = (listSearchableFields || [titleField?.name]).map((fieldName) => {
        return {
          [fieldName]: {
            like: search,
          },
        }
      }, [])

      if (searchAsConditions.length > 0) {
        const searchFilter: Where = {
          or: [...searchAsConditions],
        }

        copyOfWhere = hoistQueryParamsToAnd(copyOfWhere, searchFilter)
      }
    }

    if (page) params.page = page
    if (sort) params.sort = sort
    if (cacheBust) params.cacheBust = cacheBust
    if (copyOfWhere) params.where = copyOfWhere
    if (versions?.drafts) params.draft = 'true'

    setParams(params)
  }, [
    page,
    sort,
    where,
    search,
    cacheBust,
    filterOptions,
    selectedCollectionConfig,
    t,
    setParams,
    titleField?.name,
  ])

  useEffect(() => {
    const newPreferences = {
      limit,
      sort,
    }

    setPreference(preferenceKey, newPreferences, true)
  }, [sort, limit, setPreference, preferenceKey])

  useEffect(() => {
    setPage(1)
  }, [search])

  const onCreateNew = useCallback(
    ({ doc }) => {
      if (typeof onSelect === 'function') {
        onSelect({
          collectionConfig: selectedCollectionConfig,
          docID: doc.id,
        })
      }
      dispatchCacheBust()
      closeModal(documentDrawerSlug)
      closeModal(drawerSlug)
    },
    [closeModal, documentDrawerSlug, drawerSlug, onSelect, selectedCollectionConfig],
  )

  if (!selectedCollectionConfig || isError) {
    return null
  }

  const listComponent = selectedCollectionConfig?.admin?.components?.views?.List
  let ListToRender = null

  if (listComponent && typeof listComponent === 'function') {
    ListToRender = listComponent
  } else if (typeof listComponent === 'object' && typeof listComponent.Component === 'function') {
    ListToRender = listComponent.Component
  }

  return (
    <TableColumnsProvider
      cellProps={[
        {
          className: `${baseClass}__first-cell`,
          link: false,
          onClick: ({ collection: rowColl, rowData }) => {
            if (typeof onSelect === 'function') {
              onSelect({
                collectionConfig: rowColl,
                docID: rowData.id,
              })
            }
          },
        },
      ]}
      collection={selectedCollectionConfig}
    >
      <DocumentInfoProvider collection={selectedCollectionConfig}>
        <RenderCustomComponent
          CustomComponent={ListToRender}
          DefaultComponent={DefaultList}
          componentProps={{
            collection: {
              ...selectedCollectionConfig,
              fields,
            },
            customHeader: (
              <header className={`${baseClass}__header`}>
                <div className={`${baseClass}__header-wrap`}>
                  <div className={`${baseClass}__header-content`}>
                    <h2 className={`${baseClass}__header-text`}>
                      {!customHeader
                        ? getTranslation(selectedCollectionConfig?.labels?.plural, i18n)
                        : customHeader}
                    </h2>
                    {hasCreatePermission && (
                      <DocumentDrawerToggler className={`${baseClass}__create-new-button`}>
                        <Pill>{t('general:createNew')}</Pill>
                      </DocumentDrawerToggler>
                    )}
                  </div>
                  <button
                    className={`${baseClass}__header-close`}
                    onClick={() => {
                      closeModal(drawerSlug)
                    }}
                    type="button"
                  >
                    <X />
                  </button>
                </div>
                {selectedCollectionConfig?.admin?.description && (
                  <div className={`${baseClass}__sub-header`}>
                    <ViewDescription description={selectedCollectionConfig.admin.description} />
                  </div>
                )}
                {moreThanOneAvailableCollection && (
                  <div className={`${baseClass}__select-collection-wrap`}>
                    <Label label={t('selectCollectionToBrowse')} />
                    <ReactSelect
                      className={`${baseClass}__select-collection`}
                      onChange={setSelectedOption} // this is only changing the options which is not rerunning my effect
                      options={enabledCollectionConfigs.map((coll) => ({
                        label: getTranslation(coll.labels.singular, i18n),
                        value: coll.slug,
                      }))}
                      value={selectedOption}
                    />
                  </div>
                )}
              </header>
            ),
            data,
            handlePageChange: setPage,
            handlePerPageChange: setLimit,
            handleSearchChange: setSearch,
            handleSortChange: setSort,
            handleWhereChange: setWhere,
            hasCreatePermission,
            limit: limit || selectedCollectionConfig?.admin?.pagination?.defaultLimit,
            modifySearchParams: false,
            newDocumentURL: null,
            setLimit,
            setSort,
            titleField,
          }}
        />
      </DocumentInfoProvider>
      <DocumentDrawer onSave={onCreateNew} />
    </TableColumnsProvider>
  )
}
