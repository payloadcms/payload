'use client'
import type { PaginatedDocs, RelationshipFieldProps, Where } from 'payload'

import { wordBoundariesRegex } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'

import type { DocumentDrawerProps } from '../../elements/DocumentDrawer/types.js'
import type { GetResults, Option, Value } from './types.js'

import { AddNewRelation } from '../../elements/AddNewRelation/index.js'
import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fetchWithMethodOverride } from '../../utilities/fetchWithMethodOverride.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import { createRelationMap } from './createRelationMap.js'
import { findOptionsByValue } from './findOptionsByValue.js'
import './index.scss'
import { optionsReducer } from './optionsReducer.js'
import { MultiValueLabel } from './select-components/MultiValueLabel/index.js'
import { SingleValue } from './select-components/SingleValue/index.js'

const maxResultsPerRequest = 10

const baseClass = 'relationship'

const RelationshipFieldComponent: React.FC<RelationshipFieldProps> = (props) => {
  const {
    descriptionProps,
    errorProps,
    field,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        allowCreate = true,
        className,
        description,
        isSortable = true,
        readOnly: readOnlyFromAdmin,
        sortOptions,
        style,
        width,
      } = {},
      hasMany,
      label,
      relationTo,
      required,
    },
    labelProps,
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props
  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const { config } = useConfig()

  const {
    collections,
    routes: { api },
    serverURL,
  } = config

  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()
  const { code: locale } = useLocale()
  const hasMultipleRelations = Array.isArray(relationTo)
  const [options, dispatchOptions] = useReducer(optionsReducer, [])
  const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = useState(-1)
  const [lastLoadedPage, setLastLoadedPage] = useState<Record<string, number>>({})
  const [errorLoading, setErrorLoading] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [enableWordBoundarySearch, setEnableWordBoundarySearch] = useState(false)
  const menuIsOpen = useRef(false)
  const hasLoadedFirstPageRef = useRef(false)

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, required })
      }
    },
    [validate, required],
  )
  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const {
    filterOptions,
    formInitializing,
    formProcessing,
    initialValue,
    path,
    setValue,
    showError,
    value,
  } = useField<Value | Value[]>({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const readOnly = readOnlyFromProps || readOnlyFromContext || formInitializing

  const valueRef = useRef(value)
  valueRef.current = value

  const [drawerIsOpen, setDrawerIsOpen] = useState(false)

  const getResults: GetResults = useCallback(
    async ({
      lastFullyLoadedRelation: lastFullyLoadedRelationArg,
      lastLoadedPage: lastLoadedPageArg,
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
          const relationFilterOption = filterOptions?.[relation]

          let lastLoadedPageToUse
          if (search !== searchArg) {
            lastLoadedPageToUse = 1
          } else {
            lastLoadedPageToUse = lastLoadedPageArg[relation] + 1
          }
          await priorRelation

          if (relationFilterOption === false) {
            setLastFullyLoadedRelation(relations.indexOf(relation))
            return Promise.resolve()
          }

          if (resultsFetched < 10) {
            const collection = collections.find((coll) => coll.slug === relation)
            const fieldToSearch = collection?.admin?.useAsTitle || 'id'
            let fieldToSort = collection?.defaultSort || 'id'
            if (typeof sortOptions === 'string') {
              fieldToSort = sortOptions
            } else if (sortOptions?.[relation]) {
              fieldToSort = sortOptions[relation]
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
              sort: fieldToSort,
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

            const response = await fetchWithMethodOverride({
              api,
              language: i18n.language,
              queryStr: qs.stringify(query),
              relation,
              serverURL,
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

        if (typeof onSuccess === 'function') {
          onSuccess()
        }
      }
    },
    [
      permissions,
      relationTo,
      hasMany,
      errorLoading,
      search,
      collections,
      locale,
      filterOptions,
      serverURL,
      sortOptions,
      api,
      i18n,
      config,
      t,
    ],
  )

  const updateSearch = useDebouncedCallback((searchArg: string, valueArg: Value | Value[]) => {
    void getResults({ lastLoadedPage: {}, search: searchArg, sort: true, value: valueArg })
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
          const response = await fetchWithMethodOverride({
            api,
            language: i18n.language,
            queryStr: qs.stringify(query),
            relation,
            serverURL,
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

  // When (`relationTo` || `filterOptions` || `locale`) changes, reset component
  // Note - effect should not run on first run
  useEffect(() => {
    // If the menu is open while filterOptions changes
    // due to latency of getFormState and fast clicking into this field,
    // re-fetch options

    if (hasLoadedFirstPageRef.current && menuIsOpen.current) {
      setIsLoading(true)
      void getResults({
        lastLoadedPage: {},
        onSuccess: () => {
          hasLoadedFirstPageRef.current = true
          setIsLoading(false)
        },
        value: valueRef.current,
      })
    }

    // If the menu is not open, still reset the field state
    // because we need to get new options next time the menu
    // opens by the user

    dispatchOptions({ type: 'CLEAR' })
    setLastFullyLoadedRelation(-1)
    setLastLoadedPage({})
    hasLoadedFirstPageRef.current = false
  }, [
    relationTo,
    filterOptions,
    locale,
    menuIsOpen,
    getResults,
    valueRef,
    hasLoadedFirstPageRef,
    path,
  ])

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

  if (!Array.isArray(valueToRender) && valueToRender?.value === 'null') {
    valueToRender.value = null
  }

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        errorLoading && 'error-loading',
        readOnly && `${baseClass}--read-only`,
        !readOnly && allowCreate && `${baseClass}--allow-create`,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      <FieldLabel
        field={field}
        Label={field?.admin?.components?.Label}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError
          CustomError={field?.admin?.components?.Error}
          field={field}
          path={path}
          {...(errorProps || {})}
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
              disabled={readOnly || formProcessing || drawerIsOpen}
              filterOption={enableWordBoundarySearch ? filterOption : undefined}
              getOptionValue={(option) => {
                if (!option) {
                  return undefined
                }
                return hasMany && Array.isArray(relationTo)
                  ? `${option.relationTo}_${option.value}`
                  : option.value
              }}
              isLoading={isLoading}
              isMulti={hasMany}
              isSortable={isSortable}
              onChange={
                !readOnly
                  ? (selected) => {
                      if (selected === null) {
                        setValue(hasMany ? [] : null)
                      } else if (hasMany && Array.isArray(selected)) {
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
                      } else if (hasMultipleRelations && !Array.isArray(selected)) {
                        setValue({
                          relationTo: selected.relationTo,
                          value: selected.value,
                        })
                      } else if (!Array.isArray(selected)) {
                        setValue(selected.value)
                      }
                    }
                  : undefined
              }
              onInputChange={(newSearch) => handleInputChange(newSearch, value)}
              onMenuClose={() => {
                menuIsOpen.current = false
              }}
              onMenuOpen={() => {
                menuIsOpen.current = true

                if (!hasLoadedFirstPageRef.current) {
                  setIsLoading(true)
                  void getResults({
                    lastLoadedPage: {},
                    onSuccess: () => {
                      hasLoadedFirstPageRef.current = true
                      setIsLoading(false)
                    },
                    value: initialValue,
                  })
                }
              }}
              onMenuScrollToBottom={() => {
                void getResults({
                  lastFullyLoadedRelation,
                  lastLoadedPage,
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
                hasMany={hasMany}
                path={path}
                relationTo={relationTo}
                setValue={setValue}
                value={value}
              />
            )}
          </div>
        )}
        {errorLoading && <div className={`${baseClass}__error-loading`}>{errorLoading}</div>}
        <FieldDescription
          Description={field?.admin?.components?.Description}
          description={description}
          field={field}
          {...(descriptionProps || {})}
        />
      </div>
    </div>
  )
}

export const RelationshipField = withCondition(RelationshipFieldComponent)
