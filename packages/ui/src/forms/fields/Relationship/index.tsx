'use client'
import type { PaginatedDocs } from 'payload/database'
import type { Where } from 'payload/types'

import { wordBoundariesRegex } from 'payload/utilities'
import qs from 'qs'
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'

import type { DocumentDrawerProps } from '../../../elements/DocumentDrawer/types.js'
import type { FilterOptionsResult, GetResults, Option, Props, Value } from './types.js'

import { GetFilterOptions } from '../../../elements/GetFilterOptions/index.js'
import ReactSelect from '../../../elements/ReactSelect/index.js'
import { useDebouncedCallback } from '../../../hooks/useDebouncedCallback.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { useFormProcessing } from '../../Form/context.js'
import { useField } from '../../useField/index.js'
import { withCondition } from '../../withCondition/index.js'
import { fieldBaseClass } from '../shared.js'
import { AddNewRelation } from './AddNew/index.js'
import { createRelationMap } from './createRelationMap.js'
import { findOptionsByValue } from './findOptionsByValue.js'
import './index.scss'
import optionsReducer from './optionsReducer.js'
import { MultiValueLabel } from './select-components/MultiValueLabel/index.js'
import { SingleValue } from './select-components/SingleValue/index.js'

const maxResultsPerRequest = 10

const baseClass = 'relationship'

const Relationship: React.FC<Props> = (props) => {
  const {
    name,
    Description,
    Error,
    Label,
    className,
    path: pathFromProps,
    readOnly,
    required,
    style,
    validate,
    width,
  } = props

  const config = useConfig()

  const {
    collections,
    routes: { api },
    serverURL,
  } = config

  const relationTo = 'relationTo' in props ? props?.relationTo : undefined
  const hasMany = 'hasMany' in props ? props?.hasMany : undefined
  const filterOptions = 'filterOptions' in props ? props?.filterOptions : undefined
  const sortOptions = 'sortOptions' in props ? props?.sortOptions : undefined
  const isSortable = 'isSortable' in props ? props?.isSortable : true
  const allowCreate = 'allowCreate' in props ? props?.allowCreate : true

  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()
  const { code: locale } = useLocale()
  const formProcessing = useFormProcessing()
  const hasMultipleRelations = Array.isArray(relationTo)
  const [options, dispatchOptions] = useReducer(optionsReducer, [])
  const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = useState(-1)
  const [lastLoadedPage, setLastLoadedPage] = useState<Record<string, number>>({})
  const [errorLoading, setErrorLoading] = useState('')
  const [filterOptionsResult, setFilterOptionsResult] = useState<FilterOptionsResult>()
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedFirstPage, setHasLoadedFirstPage] = useState(false)
  const [enableWordBoundarySearch, setEnableWordBoundarySearch] = useState(false)
  const firstRun = useRef(true)

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, required })
      }
    },
    [validate, required],
  )

  const { initialValue, path, setValue, showError, value } = useField<Value | Value[]>({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const [drawerIsOpen, setDrawerIsOpen] = useState(false)

  const getResults: GetResults = useCallback(
    async ({
      lastFullyLoadedRelation: lastFullyLoadedRelationArg,
      onSuccess,
      search: searchArg,
      sort,
      value: valueArg,
    }) => {
      if (!permissions) {
        return
      }
      const lastFullyLoadedRelationToUse =
        typeof lastFullyLoadedRelationArg !== 'undefined' ? lastFullyLoadedRelationArg : -1

      const relations = Array.isArray(relationTo) ? relationTo : [relationTo]
      const relationsToFetch =
        lastFullyLoadedRelationToUse === -1
          ? relations
          : relations.slice(lastFullyLoadedRelationToUse + 1)

      let resultsFetched = 0
      const relationMap = createRelationMap({
        hasMany,
        relationTo,
        value: valueArg,
      })

      if (!errorLoading) {
        await relationsToFetch.reduce(async (priorRelation, relation) => {
          const relationFilterOption = filterOptionsResult?.[relation]
          let lastLoadedPageToUse
          if (search !== searchArg) {
            lastLoadedPageToUse = 1
          } else {
            lastLoadedPageToUse = lastLoadedPage[relation] + 1
          }
          await priorRelation

          if (relationFilterOption === false) {
            setLastFullyLoadedRelation(relations.indexOf(relation))
            return Promise.resolve()
          }

          if (resultsFetched < 10) {
            const collection = collections.find((coll) => coll.slug === relation)
            let fieldToSearch = collection?.defaultSort || collection?.admin?.useAsTitle || 'id'
            if (!searchArg) {
              if (typeof sortOptions === 'string') {
                fieldToSearch = sortOptions
              } else if (sortOptions?.[relation]) {
                fieldToSearch = sortOptions[relation]
              }
            }

            const query: {
              [key: string]: unknown
              where: Where
            } = {
              depth: 0,
              draft: true,
              limit: maxResultsPerRequest,
              locale,
              page: lastLoadedPageToUse,
              sort: fieldToSearch,
              where: {
                and: [
                  {
                    id: {
                      not_in: relationMap[relation],
                    },
                  },
                ],
              },
            }

            if (searchArg) {
              query.where.and.push({
                [fieldToSearch]: {
                  like: searchArg,
                },
              })
            }

            if (relationFilterOption && typeof relationFilterOption !== 'boolean') {
              query.where.and.push(relationFilterOption)
            }

            const response = await fetch(`${serverURL}${api}/${relation}?${qs.stringify(query)}`, {
              credentials: 'include',
              headers: {
                'Accept-Language': i18n.language,
              },
            })

            if (response.ok) {
              const data: PaginatedDocs<unknown> = await response.json()
              setLastLoadedPage((prevState) => {
                return {
                  ...prevState,
                  [relation]: lastLoadedPageToUse,
                }
              })

              if (!data.nextPage) {
                setLastFullyLoadedRelation(relations.indexOf(relation))
              }

              if (data.docs.length > 0) {
                resultsFetched += data.docs.length

                dispatchOptions({
                  type: 'ADD',
                  collection,
                  // TODO: fix this
                  // @ts-expect-error-next-line
                  config,
                  docs: data.docs,
                  i18n,
                  sort,
                })
              }
            } else if (response.status === 403) {
              setLastFullyLoadedRelation(relations.indexOf(relation))
              dispatchOptions({
                type: 'ADD',
                collection,
                // TODO: fix this
                // @ts-expect-error-next-line
                config,
                docs: [],
                i18n,
                ids: relationMap[relation],
                sort,
              })
            } else {
              setErrorLoading(t('error:unspecific'))
            }
          }
        }, Promise.resolve())

        if (typeof onSuccess === 'function') onSuccess()
      }
    },
    [
      permissions,
      relationTo,
      hasMany,
      errorLoading,
      search,
      lastLoadedPage,
      collections,
      locale,
      filterOptionsResult,
      serverURL,
      sortOptions,
      api,
      i18n,
      config,
      t,
    ],
  )

  const updateSearch = useDebouncedCallback((searchArg: string, valueArg: Value | Value[]) => {
    void getResults({ search: searchArg, sort: true, value: valueArg })
    setSearch(searchArg)
  }, 300)

  const handleInputChange = useCallback(
    (searchArg: string, valueArg: Value | Value[]) => {
      if (search !== searchArg) {
        setLastLoadedPage({})
        updateSearch(searchArg, valueArg, searchArg !== '')
      }
    },
    [search, updateSearch],
  )

  // ///////////////////////////////////
  // Ensure we have an option for each value
  // ///////////////////////////////////

  useEffect(() => {
    const relationMap = createRelationMap({
      hasMany,
      relationTo,
      value,
    })

    void Object.entries(relationMap).reduce(async (priorRelation, [relation, ids]) => {
      await priorRelation

      const idsToLoad = ids.filter((id) => {
        return !options.find((optionGroup) =>
          optionGroup?.options?.find(
            (option) => option.value === id && option.relationTo === relation,
          ),
        )
      })

      if (idsToLoad.length > 0) {
        const query = {
          depth: 0,
          draft: true,
          limit: idsToLoad.length,
          locale,
          where: {
            id: {
              in: idsToLoad,
            },
          },
        }

        if (!errorLoading) {
          const response = await fetch(`${serverURL}${api}/${relation}?${qs.stringify(query)}`, {
            credentials: 'include',
            headers: {
              'Accept-Language': i18n.language,
            },
          })

          const collection = collections.find((coll) => coll.slug === relation)
          let docs = []

          if (response.ok) {
            const data = await response.json()
            docs = data.docs
          }

          dispatchOptions({
            type: 'ADD',
            collection,
            // TODO: fix this
            // @ts-expect-error-next-line
            config,
            docs,
            i18n,
            ids: idsToLoad,
            sort: true,
          })
        }
      }
    }, Promise.resolve())
  }, [
    options,
    value,
    hasMany,
    errorLoading,
    collections,
    hasMultipleRelations,
    serverURL,
    api,
    i18n,
    relationTo,
    locale,
    config,
  ])

  // Determine if we should switch to word boundary search
  useEffect(() => {
    const relations = Array.isArray(relationTo) ? relationTo : [relationTo]
    const isIdOnly = relations.reduce((idOnly, relation) => {
      const collection = collections.find((coll) => coll.slug === relation)
      const fieldToSearch = collection?.admin?.useAsTitle || 'id'
      return fieldToSearch === 'id' && idOnly
    }, true)
    setEnableWordBoundarySearch(!isIdOnly)
  }, [relationTo, collections])

  // When (`relationTo` || `filterOptionsResult` || `locale`) changes, reset component
  // Note - effect should not run on first run
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }

    dispatchOptions({ type: 'CLEAR' })
    setLastFullyLoadedRelation(-1)
    setLastLoadedPage({})
    setHasLoadedFirstPage(false)
  }, [relationTo, filterOptionsResult, locale])

  const onSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      dispatchOptions({
        type: 'UPDATE',
        collection: args.collectionConfig,
        // TODO: fix this
        // @ts-expect-error-next-line
        config,
        doc: args.doc,
        i18n,
      })
    },
    [i18n, config],
  )

  const filterOption = useCallback((item: Option, searchFilter: string) => {
    if (!searchFilter) {
      return true
    }
    const r = wordBoundariesRegex(searchFilter || '')
    // breaking the labels to search into smaller parts increases performance
    const breakApartThreshold = 250
    let string = item.label
    // strings less than breakApartThreshold length won't be chunked
    while (string.length > breakApartThreshold) {
      // slicing by the next space after the length of the search input prevents slicing the string up by partial words
      const indexOfSpace = string.indexOf(' ', searchFilter.length)
      if (r.test(string.slice(0, indexOfSpace === -1 ? searchFilter.length : indexOfSpace + 1))) {
        return true
      }
      string = string.slice(indexOfSpace === -1 ? searchFilter.length : indexOfSpace + 1)
    }
    return r.test(string.slice(-breakApartThreshold))
  }, [])

  const valueToRender = findOptionsByValue({ options, value })

  if (!Array.isArray(valueToRender) && valueToRender?.value === 'null') valueToRender.value = null

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        errorLoading && 'error-loading',
        readOnly && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      {Error}
      {Label}
      <GetFilterOptions
        {...{
          filterOptions,
          filterOptionsResult,
          path,
          relationTo,
          setFilterOptionsResult,
        }}
      />
      {!errorLoading && (
        <div className={`${baseClass}__wrap`}>
          <ReactSelect
            backspaceRemovesValue={!drawerIsOpen}
            components={{
              MultiValueLabel,
              SingleValue,
            }}
            customProps={{
              disableKeyDown: drawerIsOpen,
              disableMouseDown: drawerIsOpen,
              onSave,
              setDrawerIsOpen,
            }}
            disabled={readOnly || formProcessing}
            filterOption={enableWordBoundarySearch ? filterOption : undefined}
            isLoading={isLoading}
            isMulti={hasMany}
            isSortable={isSortable}
            onChange={
              !readOnly
                ? (selected) => {
                    if (selected === null) {
                      setValue(hasMany ? [] : null)
                    } else if (hasMany) {
                      setValue(
                        selected
                          ? selected.map((option) => {
                              if (hasMultipleRelations) {
                                return {
                                  relationTo: option.relationTo,
                                  value: option.value,
                                }
                              }

                              return option.value
                            })
                          : null,
                      )
                    } else if (hasMultipleRelations) {
                      setValue({
                        relationTo: selected.relationTo,
                        value: selected.value,
                      })
                    } else {
                      setValue(selected.value)
                    }
                  }
                : undefined
            }
            onInputChange={(newSearch) => handleInputChange(newSearch, value)}
            onMenuOpen={() => {
              if (!hasLoadedFirstPage) {
                setIsLoading(true)
                void getResults({
                  onSuccess: () => {
                    setHasLoadedFirstPage(true)
                    setIsLoading(false)
                  },
                  value: initialValue,
                })
              }
            }}
            onMenuScrollToBottom={() => {
              void getResults({
                lastFullyLoadedRelation,
                search,
                sort: false,
                value: initialValue,
              })
            }}
            options={options}
            showError={showError}
            value={valueToRender ?? null}
          />
          {!readOnly && allowCreate && (
            <AddNewRelation
              {...{
                dispatchOptions,
                hasMany,
                options,
                path,
                relationTo,
                setValue,
                value,
              }}
            />
          )}
        </div>
      )}
      {errorLoading && <div className={`${baseClass}__error-loading`}>{errorLoading}</div>}
      {Description}
    </div>
  )
}

export default withCondition(Relationship)
