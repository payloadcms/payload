'use client'
import type { Operator, Where } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useMemo } from 'react'

import type { AddCondition, UpdateCondition, WhereBuilderProps } from './types.js'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Condition } from './Condition/index.js'
import fieldTypes from './field-types.js'
import { reduceFields } from './reduceFields.js'
import './index.scss'
import { transformWhereQuery } from './transformWhereQuery.js'
import validateWhereQuery from './validateWhereQuery.js'

const baseClass = 'where-builder'

export { WhereBuilderProps }

/**
 * The WhereBuilder component is used to render the filter controls for a collection's list view.
 * It is part of the {@link ListControls} component which is used to render the controls (search, filter, where).
 */
export const WhereBuilder: React.FC<WhereBuilderProps> = (props) => {
  const { collectionPluralLabel, fields, renderedFilters, resolvedFilterOptions } = props
  const { i18n, t } = useTranslation()

  const reducedFields = useMemo(() => reduceFields({ fields, i18n }), [fields, i18n])

  const { handleWhereChange, query } = useListQuery()
  const [shouldUpdateQuery, setShouldUpdateQuery] = React.useState(false)

  const [conditions, setConditions] = React.useState<Where[]>(() => {
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
  })

  const addCondition: AddCondition = React.useCallback(
    ({ andIndex, field, orIndex, relation }) => {
      const newConditions = [...conditions]

      const defaultOperator = fieldTypes[field.field.type].operators[0].value

      if (relation === 'and') {
        newConditions[orIndex].and.splice(andIndex, 0, {
          [field.value]: {
            [defaultOperator]: undefined,
          },
        })
      } else {
        newConditions.push({
          and: [
            {
              [field.value]: {
                [defaultOperator]: undefined,
              },
            },
          ],
        })
      }

      setConditions(newConditions)
    },
    [conditions],
  )

  const updateCondition: UpdateCondition = React.useCallback(
    ({ andIndex, field, operator: incomingOperator, orIndex, value: valueArg }) => {
      const existingRowCondition = conditions[orIndex].and[andIndex]

      const defaults = fieldTypes[field.field.type]
      const operator = incomingOperator || defaults.operators[0].value

      if (typeof existingRowCondition === 'object' && field.value) {
        const value = valueArg ?? existingRowCondition?.[operator]

        const newRowCondition = {
          [field.value]: { [operator]: value },
        }

        const newConditions = [...conditions]
        newConditions[orIndex].and[andIndex] = newRowCondition

        setConditions(newConditions)
        setShouldUpdateQuery(true)
      }
    },
    [conditions],
  )

  const removeCondition = React.useCallback(
    ({ andIndex, orIndex }) => {
      const newConditions = [...conditions]
      newConditions[orIndex].and.splice(andIndex, 1)

      if (newConditions[orIndex].and.length === 0) {
        newConditions.splice(orIndex, 1)
      }

      setConditions(newConditions)
      setShouldUpdateQuery(true)
    },
    [conditions],
  )

  const handleChange = useEffectEvent(async (conditions: Where[]) => {
    if (shouldUpdateQuery) {
      await handleWhereChange({ or: conditions })
      setShouldUpdateQuery(false)
    }
  })

  React.useEffect(() => {
    void handleChange(conditions)
  }, [conditions])

  return (
    <div className={baseClass}>
      {conditions.length > 0 && (
        <React.Fragment>
          <div className={`${baseClass}__label`}>
            {t('general:filterWhere', { label: getTranslation(collectionPluralLabel, i18n) })}
          </div>
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
                        const fieldName = Object.keys(condition)[0]

                        const operator =
                          (Object.keys(condition?.[fieldName] || {})?.[0] as Operator) || undefined

                        const value = condition?.[fieldName]?.[operator] || undefined

                        return (
                          <li key={andIndex}>
                            {andIndex !== 0 && (
                              <div className={`${baseClass}__label`}>{t('general:and')}</div>
                            )}
                            <Condition
                              addCondition={addCondition}
                              andIndex={andIndex}
                              fieldName={fieldName}
                              filterOptions={resolvedFilterOptions?.get(fieldName)}
                              operator={operator}
                              orIndex={orIndex}
                              reducedFields={reducedFields}
                              removeCondition={removeCondition}
                              RenderedFilter={renderedFilters?.get(fieldName)}
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
                field: reducedFields[0],
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
