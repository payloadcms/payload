'use client'
import type { Operator } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { dequal } from 'dequal/lite'
import { transformWhereQuery, validateWhereQuery } from 'payload/shared'
import React, { useMemo } from 'react'

import type { AddCondition, RemoveCondition, UpdateCondition, WhereBuilderProps } from './types.js'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js'
import { Button } from '../Button/index.js'
import { Condition } from './Condition/index.js'
import './index.scss'
import { fieldTypeConditions, getValidFieldOperators } from './field-types.js'

const baseClass = 'where-builder'

export { WhereBuilderProps }

/**
 * The WhereBuilder component is used to render the filter controls for a collection's list view
 * or in a form (e.g. Query Presets). When `value` and `onChange` are provided, it is controlled
 * by the form; otherwise it uses list query state from {@link useListQuery}.
 */
export const WhereBuilder: React.FC<WhereBuilderProps> = (props) => {
  const {
    collectionPluralLabel: collectionPluralLabelProp,
    collectionSlug,
    fields: fieldsProp,
    onChange,
    renderedFilters = undefined,
    resolvedFilterOptions = undefined,
    value: valueProp,
  } = props
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()
  const { getEntityConfig } = useConfig()
  const listQuery = useListQuery()

  const isFormMode = typeof onChange === 'function'

  const collectionConfig = useMemo(
    () => (isFormMode ? getEntityConfig({ collectionSlug }) : null),
    [isFormMode, collectionSlug, getEntityConfig],
  )
  const collectionPluralLabel = isFormMode
    ? (collectionConfig?.labels?.plural ?? collectionSlug)
    : (collectionPluralLabelProp ?? collectionSlug)
  const fields = isFormMode ? collectionConfig?.fields : fieldsProp
  const fieldsSafe = fields ?? []

  const fieldPermissions = permissions?.collections?.[collectionSlug]?.fields

  const reducedFields = useMemo(
    () =>
      reduceFieldsToOptions({
        fieldPermissions,
        fields: fieldsSafe,
        i18n,
      }),
    [fieldPermissions, fieldsSafe, i18n],
  )

  const conditions = useMemo(() => {
    const whereFromSearch = isFormMode ? valueProp : listQuery.query?.where

    if (whereFromSearch) {
      if (validateWhereQuery(whereFromSearch)) {
        return whereFromSearch.or ?? []
      }

      const transformedWhere = transformWhereQuery(whereFromSearch)
      if (validateWhereQuery(transformedWhere)) {
        return transformedWhere.or ?? []
      }

      if (!isFormMode) {
        console.warn(`Invalid where query in URL: ${JSON.stringify(whereFromSearch)}`) // eslint-disable-line no-console
      }
    }

    return []
  }, [isFormMode, valueProp, listQuery.query?.where])

  const handleWhereChange = isFormMode
    ? (where: { or: typeof conditions }) => {
        onChange?.(where)
      }
    : listQuery.handleWhereChange

  const addCondition: AddCondition = React.useCallback(
    async ({ andIndex, field, orIndex, relation }) => {
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

      await handleWhereChange({ or: newConditions })
    },
    [conditions, handleWhereChange],
  )

  const updateCondition: UpdateCondition = React.useCallback(
    async ({ andIndex, field, operator: incomingOperator, orIndex, value }) => {
      const existingCondition = conditions[orIndex].and[andIndex]

      if (typeof existingCondition === 'object' && field.value) {
        const { validOperator } = getValidFieldOperators({
          field: field.field,
          operator: incomingOperator,
        })

        // Skip if nothing changed
        const existingValue = existingCondition[String(field.value)]?.[validOperator]
        if (typeof existingValue !== 'undefined' && existingValue === value) {
          return
        }

        const newRowCondition = {
          [String(field.value)]: { [validOperator]: value },
        }

        if (dequal(existingCondition, newRowCondition)) {
          return
        }

        const newConditions = [...conditions]
        newConditions[orIndex].and[andIndex] = newRowCondition

        await handleWhereChange({ or: newConditions })
      }
    },
    [conditions, handleWhereChange],
  )

  const removeCondition: RemoveCondition = React.useCallback(
    async ({ andIndex, orIndex }) => {
      const newConditions = [...conditions]
      newConditions[orIndex].and.splice(andIndex, 1)

      if (newConditions[orIndex].and.length === 0) {
        newConditions.splice(orIndex, 1)
      }

      await handleWhereChange({ or: newConditions })
    },
    [conditions, handleWhereChange],
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

                        const value = condition?.[fieldPath]?.[operator] || undefined

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
            onClick={async () => {
              await addCondition({
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
            onClick={async () => {
              if (reducedFields.length > 0) {
                await addCondition({
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
