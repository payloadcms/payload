'use client'
import { getTranslation } from '@payloadcms/translations'
import {
  type CollectionSlug,
  type Column,
  type JoinFieldClient,
  type ListQuery,
  type PaginatedDocs,
  type Where,
} from 'payload'
import { hoistQueryParamsToAnd, transformColumnsToPreferences } from 'payload/shared'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'

import type { DocumentDrawerProps } from '../DocumentDrawer/types.js'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { ListQueryProvider } from '../../providers/ListQuery/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { TableColumnsProvider } from '../../providers/TableColumns/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { ListColumnSelectionButton } from '../ListColumnSelectionButton/index.js'
import { NoListResults } from '../NoListResults/index.js'
import { RelationshipProvider } from '../Table/RelationshipProvider/index.js'
import { AddNewButton } from './AddNewButton.js'
import { DrawerLink } from './cells/DrawerLink/index.js'
import { RelationshipTablePagination } from './Pagination.js'
import './index.css'

const baseClass = 'relationship-table'

type RelationshipTableComponentProps = {
  readonly AfterInput?: React.ReactNode
  readonly allowCreate?: boolean
  readonly BeforeInput?: React.ReactNode
  readonly Description?: React.ReactNode
  readonly disableTable?: boolean
  readonly field: JoinFieldClient
  readonly fieldPath?: string
  readonly filterOptions?: Where
  readonly initialData?: PaginatedDocs
  readonly initialDrawerData?: DocumentDrawerProps['initialData']
  readonly Label?: React.ReactNode
  readonly onDataChange?: (data: PaginatedDocs) => void
  readonly parent?: {
    collectionSlug: CollectionSlug
    id: number | string
    joinPath: string
  }
  readonly relationTo: string | string[]
}

export type OnDrawerOpen = (id?: string, collectionSlug?: string) => void

export const RelationshipTable: React.FC<RelationshipTableComponentProps> = (props) => {
  const {
    AfterInput,
    allowCreate = true,
    BeforeInput,
    Description,
    disableTable = false,
    field,
    fieldPath,
    filterOptions,
    initialData: initialDataFromProps,
    initialDrawerData,
    Label,
    onDataChange,
    parent,
    relationTo,
  } = props
  const [Table, setTable] = useState<React.ReactNode>(null)
  const { config, getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()

  const [query, setQuery] = useState<ListQuery>()

  const [collectionConfig] = useState(() => getEntityConfig({ collectionSlug: relationTo }))

  const isPolymorphic = Array.isArray(relationTo)

  const [selectedCollection, setSelectedCollection] = useState(
    isPolymorphic ? undefined : relationTo,
  )

  const { permissions } = useAuth()

  const openDrawerWhenRelationChanges = useRef(false)

  const [currentDrawerID, setCurrentDrawerID] = useState<string | undefined>(undefined)

  const [DocumentDrawer, , { closeDrawer, isDrawerOpen, openDrawer }] = useDocumentDrawer({
    id: currentDrawerID,
    collectionSlug: selectedCollection,
  })

  const [isLoadingTable, setIsLoadingTable] = useState(!disableTable)

  const [data, setData] = useState<PaginatedDocs>(() =>
    initialDataFromProps
      ? {
          ...initialDataFromProps,
          docs: Array.isArray(initialDataFromProps.docs)
            ? initialDataFromProps.docs.reduce((acc, doc) => {
                if (typeof doc === 'string' || typeof doc === 'number') {
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
      : undefined,
  )

  const [columnState, setColumnState] = useState<Column[]>()

  const { getTableState } = useServerFunctions()

  const getTableStateForQuery = useCallback(
    async ({
      data,
      page,
      shouldUseInteractiveQuery = true,
    }: {
      data?: PaginatedDocs
      page?: number
      shouldUseInteractiveQuery?: boolean
    } = {}) => {
      const interactiveQuery = shouldUseInteractiveQuery ? query : undefined
      const newQuery: ListQuery = {
        limit: field?.defaultLimit || collectionConfig?.admin?.pagination?.defaultLimit,
        sort: field.defaultSort || collectionConfig?.defaultSort,
        ...(interactiveQuery || {}),
        where: { ...(interactiveQuery?.where || {}) },
      }

      if (filterOptions) {
        newQuery.where = hoistQueryParamsToAnd(newQuery.where, filterOptions)
      }

      if (typeof page === 'number') {
        newQuery.page = page
      }

      // map columns from string[] to CollectionPreferences['columns']
      const defaultColumns = field.admin?.defaultColumns
        ? field.admin.defaultColumns.map((accessor) => ({
            accessor,
            active: true,
          }))
        : undefined

      const renderRowTypes =
        typeof field.admin?.disableRowTypes === 'boolean'
          ? !field.admin.disableRowTypes
          : Array.isArray(relationTo)

      return getTableState({
        collectionSlug: relationTo,
        columns: transformColumnsToPreferences(query?.columns) || defaultColumns,
        data,
        enableRowSelections: false,
        orderableFieldName:
          !field.orderable || Array.isArray(field.collection)
            ? undefined
            : `_${field.collection}_${field.name}_order`,
        parent,
        query: newQuery,
        renderRowTypes,
        tableAppearance: 'condensed',
      })
    },
    [
      field.defaultLimit,
      field.defaultSort,
      field.admin?.defaultColumns,
      field.admin?.disableRowTypes,
      field.collection,
      field.name,
      field.orderable,
      collectionConfig?.admin?.pagination?.defaultLimit,
      collectionConfig?.defaultSort,
      query,
      filterOptions,
      getTableState,
      relationTo,
      parent,
    ],
  )

  const applyTableStateResult = useCallback((result: Awaited<ReturnType<typeof getTableState>>) => {
    if (!result || !('Table' in result) || !result.data) {
      setIsLoadingTable(false)
      return
    }

    const { data: newData, state: newColumnState, Table: NewTable } = result

    setData(newData)
    setTable(NewTable)
    setColumnState(newColumnState)
    setIsLoadingTable(false)

    return newData
  }, [])

  const renderTable = useCallback(
    async (data?: PaginatedDocs) => {
      const result = await getTableStateForQuery({ data })

      return applyTableStateResult(result)
    },
    [applyTableStateResult, getTableStateForQuery],
  )

  const getCanonicalTableState = useCallback(async () => {
    return getTableStateForQuery({
      page: 1,
      shouldUseInteractiveQuery: false,
    })
  }, [getTableStateForQuery])

  const handleTableRender = useEffectEvent((query: ListQuery, disableTable: boolean) => {
    if (!disableTable && (!Table || query)) {
      void renderTable()
    }
  })

  useEffect(() => {
    handleTableRender(query, disableTable)
  }, [query, disableTable])

  const onDrawerSave = useCallback<DocumentDrawerProps['onSave']>(
    async ({ doc, operation }) => {
      if (operation === 'create') {
        closeDrawer()
      }

      const foundDocIndex = data?.docs?.findIndex((d) => d.id === doc.id)
      const withNewOrUpdatedData: PaginatedDocs = { docs: [] } as PaginatedDocs

      if (foundDocIndex !== -1) {
        const newDocs = [...data.docs]
        newDocs[foundDocIndex] = doc
        withNewOrUpdatedData.docs = newDocs
      } else {
        withNewOrUpdatedData.docs = [doc, ...data.docs]
      }

      const canonicalTableState = await getCanonicalTableState()
      const formData =
        canonicalTableState && 'Table' in canonicalTableState ? canonicalTableState.data : undefined

      if (query || !formData) {
        await renderTable(withNewOrUpdatedData)
      } else {
        applyTableStateResult(canonicalTableState)
      }

      if (formData) {
        onDataChange?.(formData)
      }
    },
    [
      data?.docs,
      renderTable,
      closeDrawer,
      getCanonicalTableState,
      onDataChange,
      query,
      applyTableStateResult,
    ],
  )

  const onDrawerDelete = useCallback<DocumentDrawerProps['onDelete']>(
    async (args) => {
      const newDocs = data.docs.filter((doc) => doc.id !== args.id)

      const canonicalTableState = await getCanonicalTableState()
      const formData =
        canonicalTableState && 'Table' in canonicalTableState ? canonicalTableState.data : undefined

      if (query || !formData) {
        await renderTable({
          ...data,
          docs: newDocs,
        })
      } else {
        applyTableStateResult(canonicalTableState)
      }

      if (formData) {
        onDataChange?.(formData)
      }
      setCurrentDrawerID(undefined)
    },
    [data, renderTable, getCanonicalTableState, onDataChange, query, applyTableStateResult],
  )

  const onDrawerOpen = useCallback<OnDrawerOpen>((id, collectionSlug) => {
    openDrawerWhenRelationChanges.current = true

    if (id) {
      setCurrentDrawerID(id)
    } else {
      setCurrentDrawerID(undefined)
    }

    if (collectionSlug) {
      setSelectedCollection(collectionSlug)
    } else {
      setSelectedCollection(undefined)
    }
  }, [])

  useEffect(() => {
    if (openDrawerWhenRelationChanges.current) {
      openDrawerWhenRelationChanges.current = false
      openDrawer()
    }
  }, [openDrawer])

  useEffect(() => {
    if (!isDrawerOpen) {
      setCurrentDrawerID(undefined)
    }
  }, [isDrawerOpen])

  const canCreate =
    allowCreate !== false &&
    permissions?.collections?.[isPolymorphic ? relationTo[0] : relationTo]?.create

  useEffect(() => {
    if (isPolymorphic && selectedCollection) {
      openDrawer()
    }
  }, [selectedCollection, openDrawer, isPolymorphic])

  useEffect(() => {
    if (isPolymorphic && !isDrawerOpen && selectedCollection) {
      setSelectedCollection(undefined)
    }
    // eslint-disable-next-line react-compiler/react-compiler -- TODO: fix
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen])

  const memoizedListQuery = React.useMemo(
    () => ({
      columns: transformColumnsToPreferences(columnState)?.map(({ accessor }) => accessor),
      limit: field.defaultLimit ?? collectionConfig?.admin?.pagination?.defaultLimit,
      sort: field.defaultSort ?? collectionConfig?.defaultSort,
    }),
    [columnState, field, collectionConfig],
  )

  const addNewButton = (
    <AddNewButton
      allowCreate={allowCreate !== false}
      baseClass={baseClass}
      buttonStyle="ghost"
      className={`${baseClass}__add-new${isPolymorphic ? '-polymorphic' : ''}`}
      collections={config.collections}
      i18n={i18n}
      label={i18n.t('fields:addNew')}
      onClick={isPolymorphic ? setSelectedCollection : openDrawer}
      permissions={permissions}
      relationTo={relationTo}
    />
  )

  const columnsButton = <ListColumnSelectionButton collectionSlug={collectionConfig?.slug} />

  return (
    <div className={baseClass}>
      {isLoadingTable ? (
        <Fragment>
          <div className={`${baseClass}__header`}>
            {Label}
            <div className={`${baseClass}__actions`}>{addNewButton}</div>
            {Description}
          </div>
          {BeforeInput}
          <p>{t('general:loading')}</p>
        </Fragment>
      ) : (
        <Fragment>
          {data?.docs && data.docs.length === 0 && (
            <Fragment>
              <div className={`${baseClass}__header`}>
                {Label}
                <div className={`${baseClass}__actions`}>{addNewButton}</div>
                {Description}
              </div>
              {BeforeInput}
              <NoListResults
                Actions={
                  canCreate
                    ? [
                        <AddNewButton
                          allowCreate={canCreate}
                          baseClass={baseClass}
                          collections={config.collections}
                          i18n={i18n}
                          key="create"
                          label={i18n.t('general:createNewLabel', {
                            label: isPolymorphic
                              ? i18n.t('general:document')
                              : getTranslation(collectionConfig?.labels?.singular, i18n),
                          })}
                          onClick={isPolymorphic ? setSelectedCollection : openDrawer}
                          permissions={permissions}
                          relationTo={relationTo}
                        />,
                      ]
                    : []
                }
                description={i18n.t('general:noResults', {
                  label: isPolymorphic
                    ? i18n.t('general:documents')
                    : getTranslation(collectionConfig?.labels?.plural, i18n),
                })}
                title={i18n.t('general:noResultsFound')}
              />
            </Fragment>
          )}
          {data?.docs && data.docs.length > 0 && (
            <RelationshipProvider>
              <ListQueryProvider
                data={data}
                modifySearchParams={false}
                onQueryChange={setQuery}
                orderableFieldName={
                  !field.orderable || Array.isArray(field.collection)
                    ? undefined
                    : `_${field.collection}_${fieldPath.replaceAll('.', '_')}_order`
                }
                query={memoizedListQuery}
              >
                <TableColumnsProvider
                  collectionSlug={isPolymorphic ? relationTo[0] : relationTo}
                  columnState={columnState}
                  LinkedCellOverride={
                    <DrawerLink currentDrawerID={currentDrawerID} onDrawerOpen={onDrawerOpen} />
                  }
                >
                  <div className={`${baseClass}__header`}>
                    {Label}
                    <div className={`${baseClass}__actions`}>
                      {addNewButton}
                      {columnsButton}
                    </div>
                    {Description}
                  </div>
                  {BeforeInput}
                  {Table}
                  <RelationshipTablePagination />
                </TableColumnsProvider>
              </ListQueryProvider>
            </RelationshipProvider>
          )}
        </Fragment>
      )}
      {AfterInput}
      <DocumentDrawer
        initialData={initialDrawerData}
        onDelete={onDrawerDelete}
        onSave={onDrawerSave}
      />
    </div>
  )
}
