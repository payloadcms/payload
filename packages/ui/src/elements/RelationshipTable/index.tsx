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
import React, { Fragment, useCallback, useEffect, useState } from 'react'

import type { DocumentDrawerProps } from '../DocumentDrawer/types.js'

import { Button } from '../../elements/Button/index.js'
import { Pill } from '../../elements/Pill/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { ListQueryProvider } from '../../providers/ListQuery/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { TableColumnsProvider } from '../../providers/TableColumns/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { AnimateHeight } from '../AnimateHeight/index.js'
import { ColumnSelector } from '../ColumnSelector/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { RelationshipProvider } from '../Table/RelationshipProvider/index.js'
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
    parent,
    relationTo,
  } = props
  const [Table, setTable] = useState<React.ReactNode>(null)
  const { config, getEntityConfig } = useConfig()

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

  const [collectionConfig] = useState(() => getEntityConfig({ collectionSlug: relationTo }))

  const [selectedCollection, setSelectedCollection] = useState(
    Array.isArray(relationTo) ? undefined : relationTo,
  )
  const [isLoadingTable, setIsLoadingTable] = useState(!disableTable)
  const [data, setData] = useState<PaginatedDocs>(initialData)
  const [columnState, setColumnState] = useState<Column[]>()

  const { getTableState } = useServerFunctions()

  const renderTable = useCallback(
    async (docs?: PaginatedDocs['docs']) => {
      const newQuery: ListQuery = {
        limit: String(field?.defaultLimit || collectionConfig?.admin?.pagination?.defaultLimit),
        sort: field.defaultSort || collectionConfig?.defaultSort,
        ...(query || {}),
        where: { ...(query?.where || {}) },
      }

      if (filterOptions) {
        newQuery.where = hoistQueryParamsToAnd(newQuery.where, filterOptions)
      }

      // map columns from string[] to ListPreferences['columns']
      const defaultColumns = field.admin.defaultColumns
        ? field.admin.defaultColumns.map((accessor) => ({
            accessor,
            active: true,
          }))
        : undefined

      const {
        data: newData,
        state: newColumnState,
        Table: NewTable,
      } = await getTableState({
        collectionSlug: relationTo,
        columns: transformColumnsToPreferences(query?.columns) || defaultColumns,
        docs,
        enableRowSelections: false,
        orderableFieldName:
          !field.orderable || Array.isArray(field.collection)
            ? undefined
            : `_${field.collection}_${field.name}_order`,
        parent,
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
      field.defaultLimit,
      field.defaultSort,
      field.admin.defaultColumns,
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

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, isDrawerOpen, openDrawer }] =
    useDocumentDrawer({
      collectionSlug: selectedCollection,
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
    [data?.docs, renderTable],
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
    [data?.docs, renderTable],
  )

  const canCreate =
    allowCreate !== false &&
    permissions?.collections?.[Array.isArray(relationTo) ? relationTo[0] : relationTo]?.create

  useEffect(() => {
    if (Array.isArray(relationTo) && selectedCollection) {
      openDrawer()
    }
  }, [selectedCollection, openDrawer, relationTo])

  useEffect(() => {
    if (Array.isArray(relationTo) && !isDrawerOpen && selectedCollection) {
      setSelectedCollection(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen])

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        {Label}
        <div className={`${baseClass}__actions`}>
          {!Array.isArray(relationTo) && canCreate && (
            <DocumentDrawerToggler className={`${baseClass}__add-new`}>
              {i18n.t('fields:addNew')}
            </DocumentDrawerToggler>
          )}

          {Array.isArray(relationTo) && (
            <Fragment>
              <Popup
                button={
                  <Button buttonStyle="none" className={`${baseClass}__add-new-polymorphic`}>
                    {i18n.t('fields:addNew')}
                    <PlusIcon />
                  </Button>
                }
                buttonType="custom"
                horizontalAlign="center"
                render={({ close: closePopup }) => (
                  <PopupList.ButtonGroup>
                    {relationTo.map((relatedCollection) => {
                      if (permissions.collections[relatedCollection].create) {
                        return (
                          <PopupList.Button
                            className={`${baseClass}__relation-button--${relatedCollection}`}
                            key={relatedCollection}
                            onClick={() => {
                              closePopup()
                              setSelectedCollection(relatedCollection)
                            }}
                          >
                            {getTranslation(
                              config.collections.find((each) => each.slug === relatedCollection)
                                .labels.singular,
                              i18n,
                            )}
                          </PopupList.Button>
                        )
                      }

                      return null
                    })}
                  </PopupList.ButtonGroup>
                )}
                size="medium"
              />
            </Fragment>
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
          {data?.docs && data.docs.length === 0 && (
            <div className={`${baseClass}__no-results`}>
              <p>
                {i18n.t('general:noResults', {
                  label: Array.isArray(relationTo)
                    ? i18n.t('general:documents')
                    : getTranslation(collectionConfig?.labels?.plural, i18n),
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
          {data?.docs && data.docs.length > 0 && (
            <RelationshipProvider>
              <ListQueryProvider
                columns={transformColumnsToPreferences(columnState)}
                data={data}
                defaultLimit={
                  field.defaultLimit ?? collectionConfig?.admin?.pagination?.defaultLimit
                }
                modifySearchParams={false}
                onQueryChange={setQuery}
                orderableFieldName={
                  !field.orderable || Array.isArray(field.collection)
                    ? undefined
                    : `_${field.collection}_${field.name}_order`
                }
              >
                <TableColumnsProvider
                  collectionSlug={Array.isArray(relationTo) ? relationTo[0] : relationTo}
                  columnState={columnState}
                  LinkedCellOverride={
                    <DrawerLink onDrawerDelete={onDrawerDelete} onDrawerSave={onDrawerSave} />
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
      <DocumentDrawer initialData={initialDrawerData} onSave={onDrawerCreate} />
    </div>
  )
}
