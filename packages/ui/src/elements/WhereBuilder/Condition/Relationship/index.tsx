'use client'
import type { PaginatedDocs, Where } from 'payload'

import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useReducer, useState } from 'react'

import type { Option } from '../../../ReactSelect/types.js'
import type { Props, ValueWithRelation } from './types.js'

import { useDebounce } from '../../../../hooks/useDebounce.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { ReactSelect } from '../../../ReactSelect/index.js'
import './index.scss'
import optionsReducer from './optionsReducer.js'

const baseClass = 'condition-value-relationship'

const maxResultsPerRequest = 10

export const RelationshipField: React.FC<Props> = (props) => {
  const {
    disabled,
    field: { admin: { isSortable } = {}, hasMany, relationTo },
    onChange,
    value,
  } = props

  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const hasMultipleRelations = Array.isArray(relationTo)
  const [options, dispatchOptions] = useReducer(optionsReducer, [])
  const [search, setSearch] = useState('')
  const [errorLoading, setErrorLoading] = useState('')
  const [hasLoadedFirstOptions, setHasLoadedFirstOptions] = useState(false)
  const debouncedSearch = useDebounce(search, 300)
  const { i18n, t } = useTranslation()
  const relationSlugs = hasMultipleRelations ? relationTo : [relationTo]
  const initialRelationMap = () => {
    const map: Map<string, number> = new Map()
    relationSlugs.forEach((relation) => {
      map.set(relation, 1)
    })
    return map
  }
  const nextPageByRelationshipRef = React.useRef<Map<string, number>>(initialRelationMap())
  const partiallyLoadedRelationshipSlugs = React.useRef<string[]>(relationSlugs)

  const addOptions = useCallback(
    (data, relation) => {
      const collection = getEntityConfig({ collectionSlug: relation })
      dispatchOptions({ type: 'ADD', collection, data, hasMultipleRelations, i18n, relation })
    },
    [hasMultipleRelations, i18n, getEntityConfig],
  )

  const loadRelationOptions = React.useCallback(
    async ({
      abortController,
      relationSlug,
    }: {
      abortController: AbortController
      relationSlug: string
    }) => {
      if (relationSlug && partiallyLoadedRelationshipSlugs.current.includes(relationSlug)) {
        const collection = getEntityConfig({
          collectionSlug: relationSlug,
        })
        const fieldToSearch = collection?.admin?.useAsTitle || 'id'
        const pageIndex = nextPageByRelationshipRef.current.get(relationSlug)

        const where: Where = {
          and: [],
        }
        const query = {
          depth: 0,
          limit: maxResultsPerRequest,
          page: pageIndex,
          select: {
            [fieldToSearch]: true,
          },
          where,
        }

        if (debouncedSearch) {
          query.where.and.push({
            [fieldToSearch]: {
              like: debouncedSearch,
            },
          })
        }

        try {
          const response = await fetch(
            `${serverURL}${api}/${relationSlug}${qs.stringify(query, { addQueryPrefix: true })}`,
            {
              credentials: 'include',
              headers: {
                'Accept-Language': i18n.language,
              },
              signal: abortController.signal,
            },
          )

          if (response.ok) {
            const data: PaginatedDocs = await response.json()
            if (data.docs.length > 0) {
              addOptions(data, relationSlug)

              if (data.nextPage) {
                nextPageByRelationshipRef.current.set(relationSlug, data.nextPage)
              } else {
                partiallyLoadedRelationshipSlugs.current =
                  partiallyLoadedRelationshipSlugs.current.filter(
                    (partiallyLoadedRelation) => partiallyLoadedRelation !== relationSlug,
                  )
              }
            }
          } else {
            setErrorLoading(t('error:unspecific'))
          }
        } catch (e) {
          if (!abortController.signal.aborted) {
            console.error(e)
          }
        }
      }

      setHasLoadedFirstOptions(true)
    },
    [addOptions, api, debouncedSearch, getEntityConfig, i18n.language, serverURL, t],
  )

  const loadMoreOptions = React.useCallback(() => {
    if (partiallyLoadedRelationshipSlugs.current.length > 0) {
      const abortController = new AbortController()
      void loadRelationOptions({
        abortController,
        relationSlug: partiallyLoadedRelationshipSlugs.current[0],
      })
    }
  }, [loadRelationOptions])

  const findOptionsByValue = useCallback((): Option | Option[] => {
    if (value) {
      if (hasMany) {
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
  }, [hasMany, hasMultipleRelations, value, options])

  const handleInputChange = (input: string) => {
    dispatchOptions({ type: 'CLEAR', i18n, required: false })
    const relationSlug = partiallyLoadedRelationshipSlugs.current[0]
    partiallyLoadedRelationshipSlugs.current = relationSlugs
    nextPageByRelationshipRef.current.set(relationSlug, 1)
    setSearch(input)
  }

  const addOptionByID = useCallback(
    async (id, relation) => {
      if (!errorLoading && id !== 'null' && id && relation) {
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

  /**
   * 1. Trigger initial relationship options fetch
   * 2. When search changes, loadRelationOptions will
   *    fire off again
   */
  useEffect(() => {
    const relations = Array.isArray(relationTo) ? relationTo : [relationTo]
    const abortControllers: AbortController[] = []
    relations.forEach((relation) => {
      const abortController = new AbortController()
      void loadRelationOptions({
        abortController,
        relationSlug: relation,
      })
      abortControllers.push(abortController)
    })

    return () => {
      abortControllers.forEach((controller) => {
        if (controller.signal) {
          try {
            controller.abort()
          } catch (_err) {
            // swallow error
          }
        }
      })
    }
  }, [i18n, loadRelationOptions, relationTo])

  /**
   * Load any options that were not returned
   * in the first 10 of each relation fetch
   */
  useEffect(() => {
    if (value && hasLoadedFirstOptions) {
      if (hasMany) {
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
          isMulti={hasMany}
          isSortable={isSortable}
          onChange={(selected) => {
            if (!selected) {
              onChange(null)
              return
            }
            if (hasMany && Array.isArray(selected)) {
              onChange(
                selected
                  ? selected.map((option) => {
                      if (hasMultipleRelations) {
                        return {
                          relationTo: option?.relationTo,
                          value: option?.value,
                        }
                      }

                      return option?.value
                    })
                  : null,
              )
            } else if (hasMultipleRelations && !Array.isArray(selected)) {
              onChange({
                relationTo: selected?.relationTo,
                value: selected?.value,
              })
            } else if (!Array.isArray(selected)) {
              onChange(selected?.value)
            }
          }}
          onInputChange={handleInputChange}
          onMenuScrollToBottom={loadMoreOptions}
          options={options}
          placeholder={t('general:selectValue')}
          value={valueToRender}
        />
      )}
      {errorLoading && <div className={`${baseClass}__error-loading`}>{errorLoading}</div>}
    </div>
  )
}
