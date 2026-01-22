'use client'
import type { Operator, Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { transformWhereQuery, validateWhereQuery } from 'payload/shared'
import React, { useMemo, useState } from 'react'

import type { AddCondition, RemoveCondition, UpdateCondition, WhereBuilderProps } from './types.js'

import { useAuth } from '../../providers/Auth/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js'
import { Button } from '../Button/index.js'
import { Condition } from './Condition/index.js'
import { fieldTypeConditions, getValidFieldOperators } from './field-types.js'
import './index.scss'

const baseClass = 'where-builder'

export { WhereBuilderProps }

/**
 * The WhereBuilder component is used to render the filter controls for a collection's list view.
 * It is part of the {@link ListControls} component which is used to render the controls (search, filter, where).
 */
export const WhereBuilder: React.FC<WhereBuilderProps> = (props) => {
  const { collectionPluralLabel, collectionSlug, fields, renderedFilters, resolvedFilterOptions } =
    props
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()

  const fieldPermissions = permissions?.collections?.[collectionSlug]?.fields

  const reducedFields = useMemo(
    () =>
      reduceFieldsToOptions({
        fieldPermissions,
        fields,
        i18n,
      }),
    [fieldPermissions, fields, i18n],
  )

  const { query, setQuery } = useListQuery()

  // Parse conditions from URL
  const urlConditions = useMemo(() => {
    const whereFromSearch = query.where

    if (whereFromSearch) {
      if (validateWhereQuery(whereFromSearch)) {
        return whereFromSearch.or
      }

      // Transform the where query to be in the right format. This will transform something simple like [text][equals]=example%20post to the right format
      const transformedWhere = transformWhereQuery(whereFromSearch)

      if (validateWhereQuery(transformedWhere)) {
        return transformedWhere.or
      }

      console.warn(`Invalid where query in URL: ${JSON.stringify(whereFromSearch)}`) // eslint-disable-line no-console
    }

    return []
  }, [query.where])

  // Local conditions state - allows adding filters without immediately updating URL
  const [localConditions, setLocalConditions] = useState<null | Where['or']>(null)

  // Use local conditions if set, otherwise use URL conditions
  const conditions = localConditions ?? urlConditions

  // Sync local conditions with URL when URL changes (e.g., after navigation)
  React.useEffect(() => {
    setLocalConditions(null)
  }, [urlConditions])

  const addCondition: AddCondition = React.useCallback(
    ({ andIndex, field, orIndex, relation }) => {
      const newConditions = [...conditions]

      const defaultOperator = fieldTypeConditions[field.field.type].operators[0].value

      if (relation === 'and') {
        newConditions[orIndex].and.splice(andIndex, 0, {
          [String(field.value)]: {
            [defaultOperator]: undefined,
          },
        })
      } else {
        newConditions.push({
          and: [
            {
              [String(field.value)]: {
                [defaultOperator]: undefined,
              },
            },
          ],
        })
      }

      // Only update local state - don't sync to URL until a value is set
      // This prevents unnecessary navigations that can detach DOM elements during user interaction
      setLocalConditions(newConditions)
    },
    [conditions],
  )

  const updateCondition: UpdateCondition = React.useCallback(
    ({ andIndex, field, operator: incomingOperator, orIndex, value }) => {
      const existingCondition = conditions[orIndex]?.and?.[andIndex]

      if (typeof existingCondition === 'object' && field?.value) {
        const { validOperator } = getValidFieldOperators({
          field: field.field,
          operator: incomingOperator,
        })
        const newRowCondition = {
          [String(field.value)]: { [validOperator]: value },
        }

        const newConditions = [...conditions]
        newConditions[orIndex].and[andIndex] = newRowCondition

        // Update local state first
        setLocalConditions(newConditions)

        // Only sync to URL when value is non-empty
        // This prevents navigations during user interaction (which can detach DOM elements)
        // and prevents MongoDB cast errors for checkbox fields with empty values
        const hasValue = value !== undefined && value !== null && value !== ''

        if (hasValue) {
          setQuery({ where: { or: newConditions } })
        }
      }
    },
    [conditions, setQuery],
  )

  const removeCondition: RemoveCondition = React.useCallback(
    ({ andIndex, orIndex }) => {
      const newConditions = [...conditions]
      newConditions[orIndex].and.splice(andIndex, 1)

      if (newConditions[orIndex].and.length === 0) {
        newConditions.splice(orIndex, 1)
      }

      // Update both local state and URL
      setLocalConditions(newConditions.length > 0 ? newConditions : null)
      setQuery({ where: newConditions.length > 0 ? { or: newConditions } : null })
    },
    [conditions, setQuery],
  )

  return (
    <div className={baseClass}>
      {conditions.length > 0 && (
        <React.Fragment>
          <p className={`${baseClass}__label`}>
            {t('general:filterWhere', { label: getTranslation(collectionPluralLabel, i18n) })}
          </p>
          <ul className={`${baseClass}__or-filters`}>
            {conditions.map((or, orIndex) => {
              const compoundOrKey = `${orIndex}_${Array.isArray(or?.and) ? or.and.length : ''}`

              return (
                <li key={compoundOrKey}>
                  {orIndex !== 0 && <div className={`${baseClass}__label`}>{t('general:or')}</div>}
                  <ul className={`${baseClass}__and-filters`}>
                    {Array.isArray(or?.and) &&
                      or.and.map((_, andIndex) => {
                        const condition = conditions[orIndex].and[andIndex]
                        const fieldPath = Object.keys(condition)[0]

                        const operator =
                          (Object.keys(condition?.[fieldPath] || {})?.[0] as Operator) || undefined

                        // Use nullish coalescing to preserve empty string values
                        const value = condition?.[fieldPath]?.[operator] ?? undefined

                        return (
                          <li key={andIndex}>
                            {andIndex !== 0 && (
                              <div className={`${baseClass}__label`}>{t('general:and')}</div>
                            )}
                            <Condition
                              addCondition={addCondition}
                              andIndex={andIndex}
                              fieldPath={fieldPath}
                              filterOptions={resolvedFilterOptions?.get(fieldPath)}
                              operator={operator}
                              orIndex={orIndex}
                              reducedFields={reducedFields}
                              removeCondition={removeCondition}
                              RenderedFilter={renderedFilters?.get(fieldPath)}
                              updateCondition={updateCondition}
                              value={value}
                            />
                          </li>
                        )
                      })}
                  </ul>
                </li>
              )
            })}
          </ul>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__add-or`}
            icon="plus"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => {
              addCondition({
                andIndex: 0,
                field: reducedFields.find((field) => !field.field.admin?.disableListFilter),
                orIndex: conditions.length,
                relation: 'or',
              })
            }}
          >
            {t('general:or')}
          </Button>
        </React.Fragment>
      )}
      {conditions.length === 0 && (
        <div className={`${baseClass}__no-filters`}>
          <div className={`${baseClass}__label`}>{t('general:noFiltersSet')}</div>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__add-first-filter`}
            icon="plus"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => {
              if (reducedFields.length > 0) {
                addCondition({
                  andIndex: 0,
                  field: reducedFields.find((field) => !field.field.admin?.disableListFilter),
                  orIndex: conditions.length,
                  relation: 'or',
                })
              }
            }}
          >
            {t('general:addFilter')}
          </Button>
        </div>
      )}
    </div>
  )
}
