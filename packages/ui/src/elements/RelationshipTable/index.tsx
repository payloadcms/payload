'use client'
import { getTranslation } from '@payloadcms/translations'
import {
  type CollectionSlug,
  type Column,
  type DocumentEvent,
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
import { useDocumentEvents } from '../../providers/DocumentEvents/index.js'
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
  readonly disableTable?: boolean
  readonly field: JoinFieldClient
  readonly fieldPath?: string
  readonly filterOptions?: Where
  readonly initialData?: PaginatedDocs
  readonly initialDrawerData?: DocumentDrawerProps['initialData']
  readonly Label?: React.ReactNode
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
    disableTable = false,
    field,
    fieldPath,
    filterOptions,
    initialData: initialDataFromProps,
    initialDrawerData,
    Label,
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

  const renderTable = useCallback(
    async (data?: PaginatedDocs) => {
      const newQuery: ListQuery = {
        limit: field?.defaultLimit || collectionConfig?.admin?.pagination?.defaultLimit,
        sort: field.defaultSort || collectionConfig?.defaultSort,
        ...(query || {}),
        where: { ...(query?.where || {}) },
      }

      if (filterOptions) {
        newQuery.where = hoistQueryParamsToAnd(newQuery.where, filterOptions)
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

      const {
        data: newData,
        state: newColumnState,
        Table: NewTable,
      } = await getTableState({
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

      setData(newData)
      setTable(NewTable)
      setColumnState(newColumnState)
      setIsLoadingTable(false)
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

  const handleTableRender = useEffectEvent((query: ListQuery, disableTable: boolean) => {
    if (!disableTable && (!Table || query)) {
      void renderTable()
    }
  })

  useEffect(() => {
    handleTableRender(query, disableTable)
  }, [query, disableTable])

  const onDrawerSave = useCallback<DocumentDrawerProps['onSave']>(
    ({ doc, operation }) => {
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

      void renderTable(withNewOrUpdatedData)
    },
    [data?.docs, renderTable, closeDrawer],
  )

  const onDrawerDelete = useCallback<DocumentDrawerProps['onDelete']>(
    (args) => {
      const newDocs = data.docs.filter((doc) => doc.id !== args.id)

      void renderTable({
        ...data,
        docs: newDocs,
      })

      setCurrentDrawerID(undefined)
    },
    [data, renderTable],
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

  // Keep this table in sync with documents created, updated, or deleted elsewhere
  // (a sibling join table, the relationship field, or an inline drawer edit).
  const { mostRecentUpdate } = useDocumentEvents()
  const lastHandledEventRef = useRef<DocumentEvent | null>(null)

  const handleDocumentEvent = useEffectEvent((event: DocumentEvent | null) => {
    if (disableTable || !event || event === lastHandledEventRef.current) {
      return
    }

    const relationSlugs = Array.isArray(relationTo) ? relationTo : [relationTo]

    if (!relationSlugs.includes(event.entitySlug)) {
      return
    }

    lastHandledEventRef.current = event

    // Skip the refetch when the current data already reflects this event — e.g. this
    // table's own drawer already applied it optimistically via onDrawerSave/onDrawerDelete,
    // or a fresh mount already loaded data that includes it. Otherwise saving/deleting from
    // this table's own drawer (which also emits a matching event) would render a second time.
    const eventDocID = event.doc?.id ?? event.id
    const existingDoc = data?.docs?.find((doc) => doc.id === eventDocID)

    const isAlreadyReflected =
      event.operation === 'delete'
        ? !existingDoc
        : Boolean(existingDoc) && existingDoc.updatedAt === event.updatedAt

    if (isAlreadyReflected) {
      return
    }

    void renderTable()
  })

  useEffect(() => {
    handleDocumentEvent(mostRecentUpdate)
  }, [mostRecentUpdate])

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
