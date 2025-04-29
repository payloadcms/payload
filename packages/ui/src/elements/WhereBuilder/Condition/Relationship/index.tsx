'use client'
import type { PaginatedDocs, Where } from 'payload'

import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useReducer, useState } from 'react'

import type { Option } from '../../../ReactSelect/types.js'
import type { RelationshipFilterProps as Props, ValueWithRelation } from './types.js'

import { useDebounce } from '../../../../hooks/useDebounce.js'
import { useEffectEvent } from '../../../../hooks/useEffectEvent.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useLocale } from '../../../../providers/Locale/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { ReactSelect } from '../../../ReactSelect/index.js'
import optionsReducer from './optionsReducer.js'
import './index.scss'

const baseClass = 'condition-value-relationship'

const maxResultsPerRequest = 10

export const RelationshipFilter: React.FC<Props> = (props) => {
  const {
    disabled,
    field: { admin: { isSortable } = {}, hasMany, relationTo },
    filterOptions,
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
  const debouncedSearch = useDebounce(search, 300)
  const [errorLoading, setErrorLoading] = useState('')
  const [hasLoadedFirstOptions, setHasLoadedFirstOptions] = useState(false)
  const { i18n, t } = useTranslation()
  const locale = useLocale()

  const relationSlugs = hasMultipleRelations ? relationTo : [relationTo]

  const loadedRelationships = React.useRef<
    Map<
      string,
      {
        hasLoadedAll: boolean
        nextPage: number
      }
    >
  >(
    new Map(
      relationSlugs.map((relation) => [
        relation,
        {
          hasLoadedAll: false,
          nextPage: 1,
        },
      ]),
    ),
  )

  const addOptions = useCallback(
    (data, relation) => {
      const collection = getEntityConfig({ collectionSlug: relation })
      dispatchOptions({ type: 'ADD', collection, data, hasMultipleRelations, i18n, relation })
    },
    [hasMultipleRelations, i18n, getEntityConfig],
  )

  const loadOptions = useEffectEvent(
    async ({
      abortController,
      relationSlug,
    }: {
      abortController: AbortController
      relationSlug: string
    }) => {
      const loadedRelationship = loadedRelationships.current.get(relationSlug)

      if (relationSlug && !loadedRelationship.hasLoadedAll) {
        const collection = getEntityConfig({
          collectionSlug: relationSlug,
        })

        const fieldToSearch = collection?.admin?.useAsTitle || 'id'

        const where: Where = {
          and: [],
        }

        const query = {
          depth: 0,
          limit: maxResultsPerRequest,
          locale: locale.code,
          page: loadedRelationship.nextPage,
          select: {
            [fieldToSearch]: true,
          },
          where,
        }

        if (filterOptions && filterOptions?.[relationSlug]) {
          query.where.and.push(filterOptions[relationSlug])
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
                loadedRelationships.current.set(relationSlug, {
                  hasLoadedAll: false,
                  nextPage: data.nextPage,
                })
              } else {
                loadedRelationships.current.set(relationSlug, {
                  hasLoadedAll: true,
                  nextPage: null,
                })
              }
            }
          } else {
            setErrorLoading(t('error:unspecific'))
          }
        } catch (e) {
          if (!abortController.signal.aborted) {
            console.error(e) // eslint-disable-line no-console
          }
        }
      }

      setHasLoadedFirstOptions(true)
    },
  )

  const handleScrollToBottom = React.useCallback(() => {
    const relationshipToLoad = loadedRelationships.current.entries().next().value

    if (relationshipToLoad[0] && !relationshipToLoad[1].hasLoadedAll) {
      const abortController = new AbortController()

      void loadOptions({
        abortController,
        relationSlug: relationshipToLoad[0],
      })
    }
  }, [])

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

  const handleInputChange = useCallback(
    (input: string) => {
      if (input !== search) {
        dispatchOptions({ type: 'CLEAR', i18n, required: false })

        const relationSlugs = Array.isArray(relationTo) ? relationTo : [relationTo]

        loadedRelationships.current = new Map(
          relationSlugs.map((relation) => [
            relation,
            {
              hasLoadedAll: false,
              nextPage: 1,
            },
          ]),
        )

        setSearch(input)
      }
    },
    [i18n, relationTo, search],
  )

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
   * When `relationTo` changes externally, reset the options and reload them from scratch
   * The `loadOptions` dependency is a useEffectEvent which has no dependencies of its own
   * This means we can safely depend on it without it triggering this effect to run
   * This is useful because this effect should _only_ run when `relationTo` changes
   */
  useEffect(() => {
    const relations = Array.isArray(relationTo) ? relationTo : [relationTo]

    loadedRelationships.current = new Map(
      relations.map((relation) => [
        relation,
        {
          hasLoadedAll: false,
          nextPage: 1,
        },
      ]),
    )

    dispatchOptions({ type: 'CLEAR', i18n, required: false })
    setHasLoadedFirstOptions(false)

    const abortControllers: AbortController[] = []

    relations.forEach((relation) => {
      const abortController = new AbortController()

      void loadOptions({
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
  }, [i18n, relationTo, debouncedSearch])

  /**
   * Load any other options that might exist in the value that were not loaded already
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
          onMenuScrollToBottom={handleScrollToBottom}
          options={options}
          placeholder={t('general:selectValue')}
          value={valueToRender}
        />
      )}
      {errorLoading && <div className={`${baseClass}__error-loading`}>{errorLoading}</div>}
    </div>
  )
}
