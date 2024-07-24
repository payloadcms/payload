import type { Where } from 'payload/types'

import qs from 'qs'
import React, { useCallback, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PaginatedDocs } from '../../../../../../database/types'
import type { Option } from '../../../ReactSelect/types'
import type { GetResults, Props, ValueWithRelation } from './types'

import useDebounce from '../../../../../hooks/useDebounce'
import { useAuth } from '../../../../utilities/Auth'
import { useConfig } from '../../../../utilities/Config'
import ReactSelect from '../../../ReactSelect'
import './index.scss'
import optionsReducer from './optionsReducer'

const baseClass = 'condition-value-relationship'

const maxResultsPerRequest = 10

const RelationshipField: React.FC<Props> = (props) => {
  const {
    admin: { isSortable } = {},
    disabled,
    filterOptions,
    hasMany,
    onChange,
    operator,
    relationTo,
    value,
  } = props

  const {
    collections,
    routes: { api },
    serverURL,
  } = useConfig()

  const hasMultipleRelations = Array.isArray(relationTo)
  const [options, dispatchOptions] = useReducer(optionsReducer, [])
  const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = useState(-1)
  const [lastLoadedPage, setLastLoadedPage] = useState(1)
  const [search, setSearch] = useState('')
  const [errorLoading, setErrorLoading] = useState('')
  const [hasLoadedFirstOptions, setHasLoadedFirstOptions] = useState(false)
  const debouncedSearch = useDebounce(search, 300)
  const { i18n, t } = useTranslation('general')
  const { user } = useAuth()

  const isMulti = ['in', 'not_in'].includes(operator)

  const addOptions = useCallback(
    (data, relation) => {
      const collection = collections.find((coll) => coll.slug === relation)
      dispatchOptions({ type: 'ADD', collection, data, hasMultipleRelations, i18n, relation })
    },
    [collections, hasMultipleRelations, i18n],
  )

  const getResults = useCallback<GetResults>(
    async ({
      lastFullyLoadedRelation: lastFullyLoadedRelationArg,
      lastLoadedPage: lastLoadedPageArg,
      search: searchArg,
    }) => {
      let lastLoadedPageToUse = typeof lastLoadedPageArg !== 'undefined' ? lastLoadedPageArg : 1
      const lastFullyLoadedRelationToUse =
        typeof lastFullyLoadedRelationArg !== 'undefined' ? lastFullyLoadedRelationArg : -1

      const relations = Array.isArray(relationTo) ? relationTo : [relationTo]
      const relationsToFetch =
        lastFullyLoadedRelationToUse === -1
          ? relations
          : relations.slice(lastFullyLoadedRelationToUse + 1)

      let resultsFetched = 0

      if (!errorLoading) {
        void relationsToFetch.reduce(async (priorRelation, relation) => {
          await priorRelation
          if (resultsFetched < 10) {
            const search: Record<string, unknown> & { where: Where } = {
              depth: 0,
              limit: maxResultsPerRequest,
              page: lastLoadedPageToUse,
              where: { and: [] },
            }
            const collection = collections.find((coll) => coll.slug === relation)
            const fieldToSearch = collection?.admin?.useAsTitle || 'id'
            // add search arg to where object
            if (searchArg) {
              search.where.and.push({
                [fieldToSearch]: {
                  like: searchArg,
                },
              })
            }
            // call the filterOptions function if it exists passing in the collection
            if (filterOptions) {
              const optionFilter =
                typeof filterOptions === 'function'
                  ? await filterOptions({
                      // data and siblingData are empty since we cannot fetch with the values covering the
                      // entire list this limitation means that filterOptions functions using a document's
                      //  data are unsupported in the whereBuilder
                      id: undefined,
                      data: {},
                      relationTo: collection.slug,
                      siblingData: {},
                      user,
                    })
                  : filterOptions
              if (typeof optionFilter === 'object') {
                search.where.and.push(optionFilter)
              }
              if (optionFilter === false) {
                // no options will be returned
                setLastFullyLoadedRelation(relations.indexOf(relation))

                // If there are more relations to search, need to reset lastLoadedPage to 1
                // both locally within function and state
                if (relations.indexOf(relation) + 1 < relations.length) {
                  lastLoadedPageToUse = 1
                }
                return
              }
            }

            if (search.where.and.length === 0) {
              delete search.where
            }

            const response = await fetch(`${serverURL}${api}/${relation}?${qs.stringify(search)}`, {
              credentials: 'include',
              headers: {
                'Accept-Language': i18n.language,
              },
            })

            if (response.ok) {
              const data: PaginatedDocs = await response.json()
              if (data.docs.length > 0) {
                resultsFetched += data.docs.length
                addOptions(data, relation)
                setLastLoadedPage(data.page)

                if (!data.nextPage) {
                  setLastFullyLoadedRelation(relations.indexOf(relation))

                  // If there are more relations to search, need to reset lastLoadedPage to 1
                  // both locally within function and state
                  if (relations.indexOf(relation) + 1 < relations.length) {
                    lastLoadedPageToUse = 1
                  }
                }
              }
            } else {
              setErrorLoading(t('error:unspecific'))
            }
          }
        }, Promise.resolve())
      }
    },
    [
      relationTo,
      errorLoading,
      collections,
      filterOptions,
      serverURL,
      api,
      i18n.language,
      user,
      addOptions,
      t,
    ],
  )

  const findOptionsByValue = useCallback((): Option | Option[] => {
    if (value) {
      if (hasMany || isMulti) {
        if (Array.isArray(value)) {
          return value.map((val) => {
            if (hasMultipleRelations) {
              let matchedOption: Option

              options.forEach((opt) => {
                if (opt.options) {
                  opt.options.some((subOpt) => {
                    if (subOpt?.value == val.value) {
                      matchedOption = subOpt
                      return true
                    }

                    return false
                  })
                }
              })

              return matchedOption
            }

            return options.find((opt) => opt.value == val)
          })
        }

        return undefined
      }

      if (hasMultipleRelations) {
        let matchedOption: Option

        const valueWithRelation = value as ValueWithRelation

        options.forEach((opt) => {
          if (opt?.options) {
            opt.options.some((subOpt) => {
              if (subOpt?.value == valueWithRelation.value) {
                matchedOption = subOpt
                return true
              }
              return false
            })
          }
        })

        return matchedOption
      }

      return options.find((opt) => opt.value == value)
    }

    return undefined
  }, [hasMany, hasMultipleRelations, isMulti, value, options])

  const handleInputChange = useCallback(
    (newSearch) => {
      if (search !== newSearch) {
        setSearch(newSearch)
      }
    },
    [search],
  )

  const addOptionByID = useCallback(
    async (id, relation) => {
      if (!errorLoading && id !== 'null') {
        const response = await fetch(`${serverURL}${api}/${relation}/${id}?depth=0`, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        })

        if (response.ok) {
          const data = await response.json()
          addOptions({ docs: [data] }, relation)
        } else {
          // eslint-disable-next-line no-console
          console.error(t('error:loadingDocument', { id }))
        }
      }
    },
    [i18n, addOptions, api, errorLoading, serverURL, t],
  )

  // ///////////////////////////
  // Get results when search input changes
  // ///////////////////////////

  useEffect(() => {
    dispatchOptions({
      type: 'CLEAR',
      i18n,
      required: true,
    })

    setHasLoadedFirstOptions(true)
    setLastLoadedPage(1)
    setLastFullyLoadedRelation(-1)
    void getResults({ search: debouncedSearch })
  }, [getResults, debouncedSearch, relationTo, i18n])

  // ///////////////////////////
  // Format options once first options have been retrieved
  // ///////////////////////////

  useEffect(() => {
    if (value && hasLoadedFirstOptions) {
      if (hasMany || isMulti) {
        const matchedOptions = findOptionsByValue()

        ;((matchedOptions as Option[]) || []).forEach((option, i) => {
          if (!option) {
            if (hasMultipleRelations) {
              void addOptionByID(value[i].value, value[i].relationTo)
            } else {
              void addOptionByID(value[i], relationTo)
            }
          }
        })
      } else {
        const matchedOption = findOptionsByValue()

        if (!matchedOption) {
          if (hasMultipleRelations) {
            const valueWithRelation = value as ValueWithRelation
            void addOptionByID(valueWithRelation.value, valueWithRelation.relationTo)
          } else {
            void addOptionByID(value, relationTo)
          }
        }
      }
    }
  }, [
    addOptionByID,
    findOptionsByValue,
    hasMany,
    hasMultipleRelations,
    isMulti,
    relationTo,
    value,
    hasLoadedFirstOptions,
  ])

  const classes = ['field-type', baseClass, errorLoading && 'error-loading']
    .filter(Boolean)
    .join(' ')

  const valueToRender = (findOptionsByValue() || value) as Option

  return (
    <div className={classes}>
      {!errorLoading && (
        <ReactSelect
          disabled={disabled}
          isMulti={hasMany || isMulti}
          isSortable={isSortable}
          onChange={(selected) => {
            if (hasMany || isMulti) {
              onChange(
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
              onChange({
                relationTo: selected.relationTo,
                value: selected.value,
              })
            } else {
              onChange(selected.value)
            }
          }}
          onInputChange={handleInputChange}
          onMenuScrollToBottom={() => {
            void getResults({ lastFullyLoadedRelation, lastLoadedPage: lastLoadedPage + 1 })
          }}
          options={options}
          placeholder={t('selectValue')}
          value={valueToRender}
        />
      )}
      {errorLoading && <div className={`${baseClass}__error-loading`}>{errorLoading}</div>}
    </div>
  )
}

export default RelationshipField
