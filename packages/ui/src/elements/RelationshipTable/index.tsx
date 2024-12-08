'use client'
import type {
  ClientCollectionConfig,
  JoinFieldClient,
  ListQuery,
  PaginatedDocs,
  Where,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useCallback, useState } from 'react'

import type { DocumentDrawerProps } from '../DocumentDrawer/types.js'
import type { Column } from '../Table/index.js'

import { Button } from '../../elements/Button/index.js'
import { Pill } from '../../elements/Pill/index.js'
import { useIgnoredEffect } from '../../hooks/useIgnoredEffect.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { ListQueryProvider } from '../../providers/ListQuery/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { hoistQueryParamsToAnd } from '../../utilities/mergeListSearchAndWhere.js'
import { AnimateHeight } from '../AnimateHeight/index.js'
import { ColumnSelector } from '../ColumnSelector/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { RelationshipProvider } from '../Table/RelationshipProvider/index.js'
import { TableColumnsProvider } from '../TableColumns/index.js'
import './index.scss'
import { DrawerLink } from './cells/DrawerLink/index.js'
import { RelationshipTablePagination } from './Pagination.js'

const baseClass = 'relationship-table'

type RelationshipTableComponentProps = {
  readonly AfterInput?: React.ReactNode
  readonly allowCreate?: boolean
  readonly BeforeInput?: React.ReactNode
  readonly disableTable?: boolean
  readonly field: JoinFieldClient
  readonly filterOptions?: Where
  readonly initialData?: PaginatedDocs
  readonly initialDrawerData?: DocumentDrawerProps['initialData']
  readonly Label?: React.ReactNode
  readonly relationTo: string
}

export const RelationshipTable: React.FC<RelationshipTableComponentProps> = (props) => {
  const {
    AfterInput,
    allowCreate = true,
    BeforeInput,
    disableTable = false,
    field,
    filterOptions,
    initialData: initialDataFromProps,
    initialDrawerData,
    Label,
    relationTo,
  } = props
  const [Table, setTable] = useState<React.ReactNode>(null)

  const { getEntityConfig } = useConfig()

  const { permissions } = useAuth()

  const [initialData] = useState<PaginatedDocs>(() => {
    if (initialDataFromProps) {
      return {
        ...initialDataFromProps,
        docs: Array.isArray(initialDataFromProps.docs)
          ? initialDataFromProps.docs.reduce((acc, doc) => {
              if (typeof doc === 'string') {
                return [
                  ...acc,
                  {
                    id: doc,
                  },
                ]
              }
              return [...acc, doc]
            }, [])
          : [],
      }
    }
  })

  const { i18n, t } = useTranslation()

  const [query, setQuery] = useState<ListQuery>()
  const [openColumnSelector, setOpenColumnSelector] = useState(false)

  const [collectionConfig] = useState(
    () => getEntityConfig({ collectionSlug: relationTo }) as ClientCollectionConfig,
  )

  const [isLoadingTable, setIsLoadingTable] = useState(!disableTable)
  const [data, setData] = useState<PaginatedDocs>(initialData)
  const [columnState, setColumnState] = useState<Column[]>()

  const { getTableState } = useServerFunctions()

  const renderTable = useCallback(
    async (docs?: PaginatedDocs['docs']) => {
      const newQuery: ListQuery = {
        limit: String(field.defaultLimit || collectionConfig.admin.pagination.defaultLimit),
        sort: field.defaultSort || collectionConfig.defaultSort,
        ...(query || {}),
        where: { ...(query?.where || {}) },
      }

      if (filterOptions) {
        newQuery.where = hoistQueryParamsToAnd(newQuery.where, filterOptions)
      }

      const {
        data: newData,
        state: newColumnState,
        Table: NewTable,
      } = await getTableState({
        collectionSlug: relationTo,
        docs,
        enableRowSelections: false,
        query: newQuery,
        renderRowTypes: true,
        tableAppearance: 'condensed',
      })

      setData(newData)
      setTable(NewTable)
      setColumnState(newColumnState)
      setIsLoadingTable(false)
    },
    [
      query,
      field.defaultLimit,
      field.defaultSort,
      collectionConfig.admin.pagination.defaultLimit,
      collectionConfig.defaultSort,
      filterOptions,
      getTableState,
      relationTo,
    ],
  )

  useIgnoredEffect(
    () => {
      if (!disableTable && (!Table || query)) {
        void renderTable()
      }
    },
    [query, disableTable],
    [Table, renderTable],
  )

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, openDrawer }] = useDocumentDrawer({
    collectionSlug: relationTo,
  })

  const onDrawerSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      const foundDocIndex = data?.docs?.findIndex((doc) => doc.id === args.doc.id)
      let withNewOrUpdatedDoc: PaginatedDocs['docs'] = undefined

      if (foundDocIndex !== -1) {
        const newDocs = [...data.docs]
        newDocs[foundDocIndex] = args.doc
        withNewOrUpdatedDoc = newDocs
      } else {
        withNewOrUpdatedDoc = [args.doc, ...data.docs]
      }

      void renderTable(withNewOrUpdatedDoc)
    },
    [data.docs, renderTable],
  )

  const onDrawerCreate = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      closeDrawer()
      void onDrawerSave(args)
    },
    [closeDrawer, onDrawerSave],
  )

  const onDrawerDelete = useCallback<DocumentDrawerProps['onDelete']>(
    (args) => {
      const newDocs = data.docs.filter((doc) => doc.id !== args.id)
      void renderTable(newDocs)
    },
    [data.docs, renderTable],
  )

  const preferenceKey = `${relationTo}-list`

  const canCreate = allowCreate !== false && permissions?.collections?.[relationTo]?.create

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        {Label}
        <div className={`${baseClass}__actions`}>
          {canCreate && (
            <DocumentDrawerToggler className={`${baseClass}__add-new`}>
              {i18n.t('fields:addNew')}
            </DocumentDrawerToggler>
          )}
          <Pill
            aria-controls={`${baseClass}-columns`}
            aria-expanded={openColumnSelector}
            className={`${baseClass}__toggle-columns ${
              openColumnSelector ? `${baseClass}__buttons-active` : ''
            }`}
            icon={<ChevronIcon direction={openColumnSelector ? 'up' : 'down'} />}
            onClick={() => setOpenColumnSelector(!openColumnSelector)}
            pillStyle="light"
          >
            {t('general:columns')}
          </Pill>
        </div>
      </div>
      {BeforeInput}
      {isLoadingTable ? (
        <p>{t('general:loading')}</p>
      ) : (
        <Fragment>
          {data.docs && data.docs.length === 0 && (
            <div className={`${baseClass}__no-results`}>
              <p>
                {i18n.t('general:noResults', {
                  label: getTranslation(collectionConfig?.labels?.plural, i18n),
                })}
              </p>
              {canCreate && (
                <Button onClick={openDrawer}>
                  {i18n.t('general:createNewLabel', {
                    label: getTranslation(collectionConfig?.labels?.singular, i18n),
                  })}
                </Button>
              )}
            </div>
          )}
          {data.docs && data.docs.length > 0 && (
            <RelationshipProvider>
              <ListQueryProvider
                collectionSlug={relationTo}
                data={data}
                defaultLimit={
                  field.defaultLimit ?? collectionConfig?.admin?.pagination?.defaultLimit
                }
                modifySearchParams={false}
                onQueryChange={setQuery}
                preferenceKey={preferenceKey}
              >
                <TableColumnsProvider
                  collectionSlug={relationTo}
                  columnState={columnState}
                  docs={data.docs}
                  LinkedCellOverride={
                    <DrawerLink onDrawerDelete={onDrawerDelete} onDrawerSave={onDrawerSave} />
                  }
                  preferenceKey={preferenceKey}
                  renderRowTypes
                  setTable={setTable}
                  sortColumnProps={{
                    appearance: 'condensed',
                  }}
                  tableAppearance="condensed"
                >
                  <AnimateHeight
                    className={`${baseClass}__columns`}
                    height={openColumnSelector ? 'auto' : 0}
                    id={`${baseClass}-columns`}
                  >
                    <div className={`${baseClass}__columns-inner`}>
                      <ColumnSelector collectionSlug={collectionConfig.slug} />
                    </div>
                  </AnimateHeight>
                  {Table}
                  <RelationshipTablePagination />
                </TableColumnsProvider>
              </ListQueryProvider>
            </RelationshipProvider>
          )}
        </Fragment>
      )}
      {AfterInput}
      <DocumentDrawer initialData={initialDrawerData} onSave={onDrawerCreate} />
    </div>
  )
}
