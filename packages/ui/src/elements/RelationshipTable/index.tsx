'use client'
import type {
  ClientCollectionConfig,
  ClientField,
  JoinFieldClient,
  PaginatedDocs,
  Where,
} from 'payload'

import React, { useCallback, useEffect, useState } from 'react'
import AnimateHeightImport from 'react-animate-height'

const AnimateHeight = AnimateHeightImport.default || AnimateHeightImport

import { getTranslation } from '@payloadcms/translations'

import type { DocumentDrawerProps } from '../DocumentDrawer/types.js'

import { Button } from '../../elements/Button/index.js'
import { Pill } from '../../elements/Pill/index.js'
import { usePayloadAPI } from '../../hooks/usePayloadAPI.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { ListQueryProvider } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ColumnSelector } from '../ColumnSelector/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { hoistQueryParamsToAnd } from '../ListDrawer/DrawerContent.js'
import { RelationshipProvider } from '../Table/RelationshipProvider/index.js'
import { TableColumnsProvider } from '../TableColumns/index.js'
import { DrawerLink } from './cells/DrawerLink/index.js'
import './index.scss'
import { RelationshipTableWrapper } from './TableWrapper.js'

const baseClass = 'relationship-table'

type RelationshipTableComponentProps = {
  readonly field: JoinFieldClient
  readonly filterOptions?: boolean | Where
  readonly initialData?: PaginatedDocs
  readonly initialDrawerState?: DocumentDrawerProps['initialState']
  readonly Label?: React.ReactNode
  readonly relationTo: string
}

export const RelationshipTable: React.FC<RelationshipTableComponentProps> = (props) => {
  const {
    field,
    filterOptions,
    initialData: initialDataFromProps,
    initialDrawerState,
    Label,
    relationTo,
  } = props

  const {
    config: {
      collections,
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const { id: docID } = useDocumentInfo()

  const { permissions } = useAuth()

  const [initialData, setInitialData] = useState<PaginatedDocs>(() => {
    if (initialDataFromProps) {
      return {
        ...initialDataFromProps,
        docs: Array.isArray(initialDataFromProps.docs)
          ? initialDataFromProps.docs.reduce((acc, doc) => {
              if (typeof doc === 'string') {
                return acc
              }
              return [...acc, doc]
            }, [])
          : [],
      }
    }
  })

  const { i18n, t } = useTranslation()

  const [limit, setLimit] = useState<number>()
  const [sort, setSort] = useState<string | undefined>(undefined)
  const [page, setPage] = useState<number>(1)
  const [where, setWhere] = useState<null | Where>(null)
  const [search, setSearch] = useState<string>('')
  const [openColumnSelector, setOpenColumnSelector] = useState(false)

  const [collectionConfig] = useState(
    () => getEntityConfig({ collectionSlug: relationTo }) as ClientCollectionConfig,
  )

  const apiURL = `${serverURL}${api}/${collectionConfig.slug}`

  const [{ data }, { setParams }] = usePayloadAPI(apiURL, {
    initialData,
    initialParams: {
      depth: 0,
    },
  })

  useEffect(() => {
    const {
      admin: { listSearchableFields, useAsTitle } = {} as ClientCollectionConfig['admin'],
      versions,
    } = collectionConfig

    const params: {
      cacheBust?: number
      depth?: number
      draft?: string
      limit?: number
      page?: number
      search?: string
      sort?: string
      where?: unknown
    } = {
      depth: 0,
    }

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

    if (limit) {
      params.limit = limit
    }
    if (page) {
      params.page = page
    }
    if (sort) {
      params.sort = sort
    }
    if (copyOfWhere) {
      params.where = copyOfWhere
    }
    if (versions?.drafts) {
      params.draft = 'true'
    }

    setParams(params)
  }, [page, sort, where, search, collectionConfig, filterOptions, initialData, limit, setParams])

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, openDrawer }] = useDocumentDrawer({
    collectionSlug: relationTo,
  })

  const onDrawerSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      const foundDocIndex = data?.docs?.findIndex((doc) => doc.id === args.doc.id)

      if (foundDocIndex !== -1) {
        const newDocs = [...data.docs]
        newDocs[foundDocIndex] = args.doc
        setInitialData({
          ...data,
          docs: newDocs,
        })
      } else {
        setInitialData({
          ...data,
          docs: [args.doc, ...data.docs],
        })
      }
    },
    [data],
  )

  const onDrawerCreate = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      closeDrawer()
      void onDrawerSave(args)
    },
    [closeDrawer, onDrawerSave],
  )

  const preferenceKey = `${relationTo}-list`

  const hasCreatePermission = permissions?.collections?.[relationTo]?.create?.permission

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        {Label}
        <div className={`${baseClass}__actions`}>
          {hasCreatePermission && (
            <DocumentDrawerToggler>{i18n.t('fields:addNew')}</DocumentDrawerToggler>
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
      {data.docs && data.docs.length === 0 && (
        <div className={`${baseClass}__no-results`}>
          <p>
            {i18n.t('general:noResults', {
              label: getTranslation(collectionConfig?.labels?.plural, i18n),
            })}
          </p>
          {hasCreatePermission && (
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
              beforeRows={[
                {
                  accessor: 'collection',
                  active: true,
                  cellProps: {
                    field: {
                      admin: {
                        components: {
                          Cell: {
                            type: 'client',
                            RenderedComponent: (
                              <Pill>{getTranslation(collectionConfig.labels.singular, i18n)}</Pill>
                            ),
                          },
                          Label: null,
                        },
                      },
                    } as ClientField,
                  },
                  Heading: i18n.t('version:type'),
                },
              ]}
              cellProps={[
                {},
                {
                  field: {
                    admin: {
                      components: {
                        Cell: {
                          type: 'client',
                          RenderedComponent: (
                            <DrawerLink field={field} onDrawerSave={onDrawerSave} />
                          ),
                        },
                      },
                    },
                  } as ClientField,
                  link: false,
                },
              ]}
              collectionSlug={relationTo}
              preferenceKey={preferenceKey}
              sortColumnProps={{
                appearance: 'condensed',
              }}
            >
              {/* @ts-expect-error TODO: get this CJS import to work, eslint keeps removing the type assertion */}
              <AnimateHeight
                className={`${baseClass}__columns`}
                height={openColumnSelector ? 'auto' : 0}
                id={`${baseClass}-columns`}
              >
                <div className={`${baseClass}__columns-inner`}>
                  <ColumnSelector collectionSlug={collectionConfig.slug} />
                </div>
              </AnimateHeight>
              <RelationshipTableWrapper collectionConfig={collectionConfig} />
            </TableColumnsProvider>
          </ListQueryProvider>
        </RelationshipProvider>
      )}
      <DocumentDrawer
        initialData={{
          category: docID,
        }}
        initialState={initialDrawerState}
        onSave={onDrawerCreate}
      />
    </div>
  )
}
