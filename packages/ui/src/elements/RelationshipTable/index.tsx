'use client'
import type { ClientCollectionConfig, ClientField, PaginatedDocs, Where } from 'payload'

import React, { useEffect, useReducer, useState } from 'react'

import { usePayloadAPI } from '../../hooks/usePayloadAPI.js'
import { useConfig } from '../../providers/Config/index.js'
import { ListQueryProvider } from '../../providers/ListQuery/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { hoistQueryParamsToAnd } from '../ListDrawer/DrawerContent.js'
import { useListDrawer } from '../ListDrawer/index.js'
import { LoadingOverlay } from '../Loading/index.js'
import { RelationshipProvider } from '../Table/RelationshipProvider/index.js'
import { TableColumnsProvider } from '../TableColumns/index.js'
import { MyCell } from './MyCell.js'
import { MyTableComponent } from './MyTable.js'
import './index.scss'

const baseClass = 'table-field-header'

type RelationshipTableComponentProps = {
  readonly Label?: React.ReactNode
  readonly initialData?: PaginatedDocs
  readonly relationTo: string
}

const filterOptions: Where = {}

const defaultLimit = 5

export const RelationshipTable: React.FC<RelationshipTableComponentProps> = (props) => {
  const { Label, initialData, relationTo } = props

  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const [limit, setLimit] = useState<number>(defaultLimit)
  const [sort, setSort] = useState<string | undefined>(undefined)
  const [page, setPage] = useState<number>(1)
  const [where, setWhere] = useState<Where | null>(null)
  const [search, setSearch] = useState<string>('')

  const collectionConfig = getEntityConfig({ collectionSlug: relationTo }) as ClientCollectionConfig

  const apiURL = `${serverURL}${api}/${collectionConfig.slug}`

  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0) // used to force a re-fetch even when apiURL is unchanged

  const [{ data, isError, isLoading: isLoadingList }, { setParams }] = usePayloadAPI(apiURL, {
    initialData,
  })

  useEffect(() => {
    const {
      admin: { listSearchableFields, useAsTitle } = {} as ClientCollectionConfig['admin'],
      versions,
    } = collectionConfig

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

    if (filterOptions && typeof filterOptions !== 'boolean') {
      copyOfWhere = hoistQueryParamsToAnd(copyOfWhere, filterOptions)
    }

    if (search) {
      const searchAsConditions = (listSearchableFields || [useAsTitle]).map((fieldName) => {
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

    if (limit) params.limit = limit
    if (page) params.page = page
    if (sort) params.sort = sort
    if (cacheBust) params.cacheBust = cacheBust
    if (copyOfWhere) params.where = copyOfWhere
    if (versions?.drafts) params.draft = 'true'

    setParams(params)
  }, [page, sort, where, search, cacheBust, collectionConfig, setParams, limit])

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    collectionSlug: relationTo,
  })

  const [ListDrawer, ListDrawerToggler] = useListDrawer({
    collectionSlugs: [relationTo],
  })

  const preferenceKey = `${relationTo}-list`

  if (isLoadingList) {
    return <LoadingOverlay />
  }

  return (
    <div>
      <div className={baseClass}>
        {Label}
        <div className={`${baseClass}__actions`}>
          <DocumentDrawerToggler>Create new</DocumentDrawerToggler>
          <ListDrawerToggler>Add existing</ListDrawerToggler>
        </div>
      </div>
      <ListQueryProvider
        data={data}
        defaultLimit={limit || collectionConfig?.admin?.pagination?.defaultLimit}
        defaultSort={sort}
        handlePageChange={setPage}
        handlePerPageChange={setLimit}
        handleSearchChange={setSearch}
        handleSortChange={setSort}
        handleWhereChange={setWhere}
        modifySearchParams={false}
        preferenceKey={preferenceKey}
      >
        <TableColumnsProvider
          cellProps={[
            {
              field: {
                admin: {
                  components: {
                    Cell: {
                      type: 'client',
                      Component: MyCell,
                    },
                  },
                },
              } as ClientField,
            },
          ]}
          collectionSlug={relationTo}
          preferenceKey={preferenceKey}
        >
          <RelationshipProvider>
            <MyTableComponent collectionConfig={collectionConfig} />
          </RelationshipProvider>
        </TableColumnsProvider>
      </ListQueryProvider>
      <ListDrawer />
      <DocumentDrawer />
    </div>
  )
}
