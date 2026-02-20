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

import { Pill } from '../../elements/Pill/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { ListQueryProvider } from '../../providers/ListQuery/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { TableColumnsProvider } from '../../providers/TableColumns/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { AnimateHeight } from '../AnimateHeight/index.js'
import { ColumnSelector } from '../ColumnSelector/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { RelationshipProvider } from '../Table/RelationshipProvider/index.js'
import { AddNewButton } from './AddNewButton.js'
import { DrawerLink } from './cells/DrawerLink/index.js'
import { RelationshipTablePagination } from './Pagination.js'
import './index.scss'

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
  const [openColumnSelector, setOpenColumnSelector] = useState(false)

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
      const defaultColumns = field.admin.defaultColumns
        ? field.admin.defaultColumns.map((accessor) => ({
            accessor,
            active: true,
          }))
        : undefined

      const renderRowTypes =
        typeof field.admin.disableRowTypes === 'boolean'
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
      field.admin.defaultColumns,
      field.admin.disableRowTypes,
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

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        {Label}
        <div className={`${baseClass}__actions`}>
          <AddNewButton
            allowCreate={allowCreate !== false}
            baseClass={baseClass}
            buttonStyle="none"
            className={`${baseClass}__add-new${isPolymorphic ? '-polymorphic' : ' doc-drawer__toggler'}`}
            collections={config.collections}
            i18n={i18n}
            icon={isPolymorphic ? 'plus' : undefined}
            label={i18n.t('fields:addNew')}
            onClick={isPolymorphic ? setSelectedCollection : openDrawer}
            permissions={permissions}
            relationTo={relationTo}
          />
          <Pill
            aria-controls={`${baseClass}-columns`}
            aria-expanded={openColumnSelector}
            className={`${baseClass}__toggle-columns ${
              openColumnSelector ? `${baseClass}__buttons-active` : ''
            }`}
            icon={<ChevronIcon direction={openColumnSelector ? 'up' : 'down'} />}
            onClick={() => setOpenColumnSelector(!openColumnSelector)}
            pillStyle="light"
            size="small"
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
          {data?.docs && data.docs.length === 0 && (
            <div className={`${baseClass}__no-results`}>
              <p>
                {i18n.t('general:noResults', {
                  label: isPolymorphic
                    ? i18n.t('general:documents')
                    : getTranslation(collectionConfig?.labels?.plural, i18n),
                })}
              </p>
              <AddNewButton
                allowCreate={canCreate}
                baseClass={baseClass}
                collections={config.collections}
                i18n={i18n}
                label={i18n.t('general:createNewLabel', {
                  label: isPolymorphic
                    ? i18n.t('general:document')
                    : getTranslation(collectionConfig?.labels?.singular, i18n),
                })}
                onClick={isPolymorphic ? setSelectedCollection : openDrawer}
                permissions={permissions}
                relationTo={relationTo}
              />
            </div>
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
                  <AnimateHeight
                    className={`${baseClass}__columns`}
                    height={openColumnSelector ? 'auto' : 0}
                    id={`${baseClass}-columns`}
                  >
                    <div className={`${baseClass}__columns-inner`}>
                      {collectionConfig && (
                        <ColumnSelector collectionSlug={collectionConfig.slug} />
                      )}
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
      <DocumentDrawer
        initialData={initialDrawerData}
        onDelete={onDrawerDelete}
        onSave={onDrawerSave}
      />
    </div>
  )
}
