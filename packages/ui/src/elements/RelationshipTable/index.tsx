'use client'
import type { ClientCollectionConfig, ClientField, PaginatedDocs, Where } from 'payload'

import React, { useEffect, useReducer, useState } from 'react'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { usePayloadAPI } from '../../hooks/usePayloadAPI.js'
import { useConfig } from '../../providers/Config/index.js'
import { ListQueryProvider } from '../../providers/ListQuery/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { hoistQueryParamsToAnd } from '../ListDrawer/DrawerContent.js'
import { useListDrawer } from '../ListDrawer/index.js'
import { LoadingOverlay } from '../Loading/index.js'
import { TableColumnsProvider } from '../TableColumns/index.js'
import { MyCell } from './MyCell.js'
import { MyTableComponent } from './MyTable.js'
import './index.scss'

const baseClass = 'table-field-header'

type RelationshipTableComponentProps = {
  readonly field: ClientField
}

const initialData: PaginatedDocs = {
  docs: [
    // {
    //   id: '123',
    //   context: {},
    //   createdAt: '2021-01-01T00:00:00.000Z',
    //   title: 'Hello',
    //   updatedAt: '2021-01-01T00:00:00.000Z',
    // },
  ],
  hasNextPage: false,
  hasPrevPage: false,
  limit: 0,
  page: 0,
  pagingCounter: 0,
  totalDocs: 0,
  totalPages: 0,
}

const relationTo = 'posts'

const filterOptions: Where = {}

const defaultLimit = 5

export const RelationshipTable: React.FC<RelationshipTableComponentProps> = (props) => {
  const { field } = props

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

  console.log(data)

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
        <h4>
          <FieldLabel
            field={field}
            label={
              'label' in field && field.label
                ? field.label
                : 'name' in field
                  ? field.name
                  : 'Untitled'
            }
          />
        </h4>
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
          <MyTableComponent collectionConfig={collectionConfig} />
        </TableColumnsProvider>
      </ListQueryProvider>
      <ListDrawer />
      <DocumentDrawer />
    </div>
  )
}
