'use client'
import type { PaginatedDocs, RelationshipFieldClientComponent, Where } from 'payload'

import { dequal } from 'dequal/lite'
import { wordBoundariesRegex } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import type { DocumentDrawerProps } from '../../elements/DocumentDrawer/types.js'
import type { ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'
import type { GetResults, Option, Value } from './types.js'

import { AddNewRelation } from '../../elements/AddNewRelation/index.js'
import { useDocumentDrawer } from '../../elements/DocumentDrawer/index.js'
import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import { fieldBaseClass } from '../shared/index.js'
import { createRelationMap } from './createRelationMap.js'
import { findOptionsByValue } from './findOptionsByValue.js'
import { optionsReducer } from './optionsReducer.js'
import { MultiValueLabel } from './select-components/MultiValueLabel/index.js'
import { SingleValue } from './select-components/SingleValue/index.js'

const maxResultsPerRequest = 10

const baseClass = 'relationship'

const RelationshipFieldComponent: RelationshipFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: {
        allowCreate = true,
        allowEdit = true,
        className,
        description,
        isSortable = true,
        sortOptions,
      } = {},
      hasMany,
      label,
      localized,
      relationTo,
      required,
    },
    path,
    readOnly,
    validate,
  } = props

  const { config, getEntityConfig } = useConfig()

  const {
    routes: { api },
    serverURL,
  } = config

  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()
  const { code: locale } = useLocale()
  const hasMultipleRelations = Array.isArray(relationTo)

  const [currentlyOpenRelationship, setCurrentlyOpenRelationship] = useState<
    Parameters<ReactSelectAdapterProps['customProps']['onDocumentDrawerOpen']>[0]
  >({
    id: undefined,
    collectionSlug: undefined,
    hasReadPermission: false,
  })

  const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = useState(-1)
  const [lastLoadedPage, setLastLoadedPage] = useState<Record<string, number>>({})
  const [errorLoading, setErrorLoading] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [enableWordBoundarySearch, setEnableWordBoundarySearch] = useState(false)
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const hasLoadedFirstPageRef = useRef(false)

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, required })
      }
    },
    [validate, required],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    filterOptions,
    initialValue,
    setValue,
    showError,
    value,
  } = useField<Value | Value[]>({
    path,
    validate: memoizedValidate,
  })
  const [options, dispatchOptions] = useReducer(optionsReducer, [])

  const valueRef = useRef(value)
  valueRef.current = value

  const [DocumentDrawer, , { isDrawerOpen, openDrawer }] = useDocumentDrawer({
    id: currentlyOpenRelationship.id,
    collectionSlug: currentlyOpenRelationship.collectionSlug,
  })

  const openDrawerWhenRelationChanges = useRef(false)

  const getResults: GetResults = useCallback(
    async ({
      filterOptions,
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
            const collection = getEntityConfig({ collectionSlug: relation })
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

            const response = await fetch(`${serverURL}${api}/${relation}`, {
              body: qs.stringify(query),
              credentials: 'include',
              headers: {
                'Accept-Language': i18n.language,
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-HTTP-Method-Override': 'GET',
              },
              method: 'POST',
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
      getEntityConfig,
      locale,
      serverURL,
      sortOptions,
      api,
      i18n,
      config,
      t,
    ],
  )

  const updateSearch = useDebouncedCallback((searchArg: string, valueArg: Value | Value[]) => {
    void getResults({
      filterOptions,
      lastLoadedPage: {},
      search: searchArg,
      sort: true,
      value: valueArg,
    })
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

  const handleValueChange = useEffectEvent((value: Value | Value[]) => {
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
          const response = await fetch(`${serverURL}${api}/${relation}`, {
            body: qs.stringify(query),
            credentials: 'include',
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-HTTP-Method-Override': 'GET',
            },
            method: 'POST',
          })

          const collection = getEntityConfig({ collectionSlug: relation })
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
  })

  const prevValue = useRef(value)
  const isFirstRenderRef = useRef(true)
  // ///////////////////////////////////
  // Ensure we have an option for each value
  // ///////////////////////////////////
  useEffect(() => {
    if (isFirstRenderRef.current || !dequal(value, prevValue.current)) {
      handleValueChange(value)
    }
    isFirstRenderRef.current = false
    prevValue.current = value
  }, [value])

  // Determine if we should switch to word boundary search
  useEffect(() => {
    const relations = Array.isArray(relationTo) ? relationTo : [relationTo]
    const isIdOnly = relations.reduce((idOnly, relation) => {
      const collection = getEntityConfig({ collectionSlug: relation })
      const fieldToSearch = collection?.admin?.useAsTitle || 'id'
      return fieldToSearch === 'id' && idOnly
    }, true)
    setEnableWordBoundarySearch(!isIdOnly)
  }, [relationTo, getEntityConfig])

  const getResultsEffectEvent: GetResults = useEffectEvent(async (args) => {
    return await getResults(args)
  })

  // When (`relationTo` || `filterOptions` || `locale`) changes, reset component
  // Note - effect should not run on first run
  useEffect(() => {
    // If the menu is open while filterOptions changes
    // due to latency of form state and fast clicking into this field,
    // re-fetch options
    if (hasLoadedFirstPageRef.current && menuIsOpen) {
      setIsLoading(true)
      void getResultsEffectEvent({
        filterOptions,
        lastLoadedPage: {},
        onSuccess: () => {
          hasLoadedFirstPageRef.current = true
          setIsLoading(false)
        },
        value: valueRef.current,
      })
    }

    // If the menu is not open, still reset the field state
    // because we need to get new options next time the menu opens
    dispatchOptions({
      type: 'CLEAR',
      exemptValues: valueRef.current,
    })

    setLastFullyLoadedRelation(-1)
    setLastLoadedPage({})
  }, [relationTo, filterOptions, locale, path, menuIsOpen])

  const onSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      dispatchOptions({
        type: 'UPDATE',
        collection: args.collectionConfig,
        config,
        doc: args.doc,
        i18n,
      })

      const currentValue = valueRef.current
      const docID = args.doc.id

      if (hasMany) {
        const unchanged = (currentValue as Option[]).some((option) =>
          typeof option === 'string' ? option === docID : option.value === docID,
        )

        const valuesToSet = (currentValue as Option[]).map((option) =>
          option.value === docID
            ? { relationTo: args.collectionConfig.slug, value: docID }
            : option,
        )

        setValue(valuesToSet, unchanged)
      } else {
        const unchanged = currentValue === docID

        setValue({ relationTo: args.collectionConfig.slug, value: docID }, unchanged)
      }
    },
    [i18n, config, hasMany, setValue],
  )

  const onDuplicate = useCallback<DocumentDrawerProps['onDuplicate']>(
    (args) => {
      dispatchOptions({
        type: 'ADD',
        collection: args.collectionConfig,
        config,
        docs: [args.doc],
        i18n,
        sort: true,
      })

      if (hasMany) {
        setValue(
          valueRef.current
            ? (valueRef.current as Option[]).concat({
                relationTo: args.collectionConfig.slug,
                value: args.doc.id,
              } as Option)
            : null,
        )
      } else {
        setValue({
          relationTo: args.collectionConfig.slug,
          value: args.doc.id,
        })
      }
    },
    [i18n, config, hasMany, setValue],
  )

  const onDelete = useCallback<DocumentDrawerProps['onDelete']>(
    (args) => {
      dispatchOptions({
        id: args.id,
        type: 'REMOVE',
        collection: args.collectionConfig,
        config,
        i18n,
      })

      if (hasMany) {
        setValue(
          valueRef.current
            ? (valueRef.current as Option[]).filter((option) => {
                return option.value !== args.id
              })
            : null,
        )
      } else {
        setValue(null)
      }

      return
    },
    [i18n, config, hasMany, setValue],
  )

  const filterOption = useCallback((item: Option, searchFilter: string) => {
    if (!searchFilter) {
      return true
    }
    const r = wordBoundariesRegex(searchFilter || '')
    // breaking the labels to search into smaller parts increases performance
    const breakApartThreshold = 250
    let labelString = String(item.label)
    // strings less than breakApartThreshold length won't be chunked
    while (labelString.length > breakApartThreshold) {
      // slicing by the next space after the length of the search input prevents slicing the string up by partial words
      const indexOfSpace = labelString.indexOf(' ', searchFilter.length)
      if (
        r.test(labelString.slice(0, indexOfSpace === -1 ? searchFilter.length : indexOfSpace + 1))
      ) {
        return true
      }
      labelString = labelString.slice(indexOfSpace === -1 ? searchFilter.length : indexOfSpace + 1)
    }
    return r.test(labelString.slice(-breakApartThreshold))
  }, [])

  const onDocumentDrawerOpen = useCallback<
    ReactSelectAdapterProps['customProps']['onDocumentDrawerOpen']
  >(({ id, collectionSlug, hasReadPermission }) => {
    openDrawerWhenRelationChanges.current = true
    setCurrentlyOpenRelationship({
      id,
      collectionSlug,
      hasReadPermission,
    })
  }, [])

  useEffect(() => {
    if (openDrawerWhenRelationChanges.current) {
      openDrawer()
      openDrawerWhenRelationChanges.current = false
    }
  }, [openDrawer, currentlyOpenRelationship])

  const valueToRender = findOptionsByValue({ allowEdit, options, value })

  if (!Array.isArray(valueToRender) && valueToRender?.value === 'null') {
    valueToRender.value = null
  }

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        errorLoading && 'error-loading',
        (readOnly || disabled) && `${baseClass}--read-only`,
        !(readOnly || disabled) && allowCreate && `${baseClass}--allow-create`,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={styles}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel label={label} localized={localized} path={path} required={required} />
        }
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError path={path} showError={showError} />}
        />
        {BeforeInput}
        {!errorLoading && (
          <div className={`${baseClass}__wrap`}>
            <ReactSelect
              backspaceRemovesValue={!isDrawerOpen}
              components={{
                MultiValueLabel,
                SingleValue,
              }}
              customProps={{
                disableKeyDown: isDrawerOpen,
                disableMouseDown: isDrawerOpen,
                onDocumentDrawerOpen,
                onSave,
              }}
              disabled={readOnly || disabled || isDrawerOpen}
              filterOption={enableWordBoundarySearch ? filterOption : undefined}
              getOptionValue={(option) => {
                if (!option) {
                  return undefined
                }
                return hasMany && Array.isArray(relationTo)
                  ? `${option.relationTo}_${option.value}`
                  : (option.value as string)
              }}
              isLoading={isLoading}
              isMulti={hasMany}
              isSortable={isSortable}
              onChange={
                !(readOnly || disabled)
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
                setMenuIsOpen(false)
              }}
              onMenuOpen={() => {
                setMenuIsOpen(true)

                if (!hasLoadedFirstPageRef.current) {
                  setIsLoading(true)
                  void getResults({
                    filterOptions,
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
                  filterOptions,
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
            {!(readOnly || disabled) && allowCreate && (
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
        {AfterInput}
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
      {currentlyOpenRelationship.collectionSlug && currentlyOpenRelationship.hasReadPermission && (
        <DocumentDrawer onDelete={onDelete} onDuplicate={onDuplicate} onSave={onSave} />
      )}
    </div>
  )
}

export const RelationshipField = withCondition(RelationshipFieldComponent)
