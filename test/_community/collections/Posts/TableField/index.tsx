'use client'
import type { ClientCollectionConfig, ClientField, PaginatedDocs, Where } from 'payload'

import {
  ListQueryProvider,
  TableColumnsProvider,
  useConfig,
  useDocumentDrawer,
  useListDrawer,
} from '@payloadcms/ui'
import React, { useState } from 'react'

import { MyCell } from './MyCell.js'
import { MyTableComponent } from './MyTable.js'
import './index.scss'

const baseClass = 'table-field-header'

type RelationshipTableComponentProps = {
  readonly field: {
    label: string
    name: string
    relationTo: string
  }
}

const initialData: PaginatedDocs = {
  docs: [
    {
      id: '123',
      context: {},
      createdAt: '2021-01-01T00:00:00.000Z',
      title: 'Hello',
      updatedAt: '2021-01-01T00:00:00.000Z',
    },
  ],
  hasNextPage: false,
  hasPrevPage: false,
  limit: 0,
  page: 0,
  pagingCounter: 0,
  totalDocs: 0,
  totalPages: 0,
}

export const TableField: React.FC<RelationshipTableComponentProps> = ({
  field,
  field: { relationTo = 'posts' },
}) => {
  const [limit, setLimit] = useState<number>()
  const [sort, setSort] = useState<string | undefined>(undefined)
  const [page, setPage] = useState<number>(1)
  const [where, setWhere] = useState<Where | null>(null)
  const [search, setSearch] = useState<string>('')

  const { getEntityConfig } = useConfig()
  const collectionConfig = getEntityConfig({ collectionSlug: relationTo }) as ClientCollectionConfig

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    collectionSlug: relationTo,
  })

  const [ListDrawer, ListDrawerToggler] = useListDrawer({
    collectionSlugs: [relationTo],
  })

  const preferenceKey = `${relationTo}-list`

  return (
    <div>
      <div className={baseClass}>
        <h4>{field?.label || field?.name || 'Untitled'}</h4>
        <div className={`${baseClass}__actions`}>
          <DocumentDrawerToggler>Create new</DocumentDrawerToggler>
          <ListDrawerToggler>Add existing</ListDrawerToggler>
        </div>
      </div>
      <ListQueryProvider
        data={initialData}
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
