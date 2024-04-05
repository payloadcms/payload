import qs from 'qs'
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PaginatedDocs } from '../../../../../database/types'
import type { Where } from '../../../../../types'
import type { DocumentDrawerProps } from '../../../elements/DocumentDrawer/types'
import type { FilterOptionsResult, GetResults, Option, Props, Value } from './types'

import { relationship } from '../../../../../fields/validations'
import wordBoundariesRegex from '../../../../../utilities/wordBoundariesRegex'
import { useDebouncedCallback } from '../../../../hooks/useDebouncedCallback'
import ReactSelect from '../../../elements/ReactSelect'
import { useAuth } from '../../../utilities/Auth'
import { useConfig } from '../../../utilities/Config'
import { GetFilterOptions } from '../../../utilities/GetFilterOptions'
import { useLocale } from '../../../utilities/Locale'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import { useFormProcessing } from '../../Form/context'
import DefaultLabel from '../../Label'
import useField from '../../useField'
import withCondition from '../../withCondition'
import { fieldBaseClass } from '../shared'
import { AddNewRelation } from './AddNew'
import { createRelationMap } from './createRelationMap'
import { findOptionsByValue } from './findOptionsByValue'
import './index.scss'
import optionsReducer from './optionsReducer'
import { MultiValueLabel } from './select-components/MultiValueLabel'
import { SingleValue } from './select-components/SingleValue'

const maxResultsPerRequest = 10

const baseClass = 'relationship'

const Relationship: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      allowCreate = true,
      className,
      components: { Error, Label } = {},
      condition,
      description,
      isSortable = true,
      readOnly,
      sortOptions,
      style,
      width,
    } = {},
    filterOptions,
    hasMany,
    label,
    path,
    relationTo,
    required,
    validate = relationship,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const config = useConfig()

  const {
    collections,
    routes: { api },
    serverURL,
  } = config

  const { i18n, t } = useTranslation('fields')
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
  const pathOrName = path || name

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      return validate(value, { ...validationOptions, required })
    },
    [validate, required],
  )

  const { errorMessage, initialValue, setValue, showError, value } = useField<Value | Value[]>({
    condition,
    path: pathOrName,
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
        relationsToFetch.reduce(async (priorRelation, relation) => {
          const relationFilterOption = filterOptionsResult?.[relation]
          let lastLoadedPageToUse
          if (search !== searchArg) {
            lastLoadedPageToUse = 1
          } else {
            lastLoadedPageToUse = lastLoadedPage[relation] + 1
          }
          await priorRelation

          if (relationFilterOption === false) {
            setLastFullyLoadedRelation(hasMultipleRelations ? relations.indexOf(relation) : -1)
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
                setLastFullyLoadedRelation(hasMultipleRelations ? relations.indexOf(relation) : -1)
              }

              if (data.docs.length > 0) {
                resultsFetched += data.docs.length

                dispatchOptions({
                  type: 'ADD',
                  collection,
                  config,
                  docs: data.docs,
                  i18n,
                  sort,
                })
              }
            } else if (response.status === 403) {
              setLastFullyLoadedRelation(hasMultipleRelations ? relations.indexOf(relation) : -1)
              dispatchOptions({
                type: 'ADD',
                collection,
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
      filterOptionsResult,
      search,
      lastLoadedPage,
      hasMultipleRelations,
      collections,
      locale,
      serverURL,
      api,
      i18n,
      sortOptions,
      config,
      t,
    ],
  )

  const updateSearch = useDebouncedCallback((searchArg: string, valueArg: Value | Value[]) => {
    getResults({ search: searchArg, sort: true, value: valueArg })
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

    Object.entries(relationMap).reduce(async (priorRelation, [relation, ids]) => {
      await priorRelation

      const idsToLoad = ids.filter((id) => {
        return !options.find(
          (optionGroup) =>
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
      id={`field-${pathOrName.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      <ErrorComp message={errorMessage} showError={showError} />
      <LabelComp htmlFor={pathOrName} label={label} required={required} />
      <GetFilterOptions
        {...{
          filterOptions,
          filterOptionsResult,
          path: pathOrName,
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
                getResults({
                  onSuccess: () => {
                    setHasLoadedFirstPage(true)
                    setIsLoading(false)
                  },
                  value: initialValue,
                })
              }
            }}
            onMenuScrollToBottom={() => {
              getResults({
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
                path: pathOrName,
                relationTo,
                setValue,
                value,
              }}
            />
          )}
        </div>
      )}
      {errorLoading && <div className={`${baseClass}__error-loading`}>{errorLoading}</div>}
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}

export default withCondition(Relationship)
