'use client'
import type { Operator } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useEffect, useState } from 'react'

import type { WhereBuilderProps } from './types.js'

import { useListQuery } from '../../providers/ListQuery/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useSearchParams } from '../../providers/SearchParams/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Condition } from './Condition/index.js'
import './index.scss'
import { reduceClientFields } from './reduceClientFields.js'
import { transformWhereQuery } from './transformWhereQuery.js'
import validateWhereQuery from './validateWhereQuery.js'

const baseClass = 'where-builder'

export { WhereBuilderProps }

/**
 * The WhereBuilder component is used to render the filter controls for a collection's list view.
 * It is part of the {@link ListControls} component which is used to render the controls (search, filter, where).
 */
export const WhereBuilder: React.FC<WhereBuilderProps> = (props) => {
  const { collectionPluralLabel, fields } = props
  const { i18n, t } = useTranslation()
  const { code: currentLocale } = useLocale()

  const [reducedFields, setReducedColumns] = useState(() => reduceClientFields({ fields, i18n }))

  useEffect(() => {
    setReducedColumns(reduceClientFields({ fields, i18n }))
  }, [fields, i18n])

  const { searchParams } = useSearchParams()
  const { handleWhereChange } = useListQuery()
  const [shouldUpdateQuery, setShouldUpdateQuery] = React.useState(false)

  // This handles initializing the where conditions from the search query (URL). That way, if you pass in
  // query params to the URL, the where conditions will be initialized from those and displayed in the UI.
  // Example: /admin/collections/posts?where[or][0][and][0][text][equals]=example%20post
  /*
    stored conditions look like this:
    [
      _or_ & _and_ queries have the same shape:
      {
        and: [{
          category: {
            equals: 'category-a'
          }
        }]
      },

      {
        and:[{
          category: {
            equals: 'category-b'
          },
          text: {
            not_equals: 'oranges'
          },
        }]
      }
    ]
  */

  const [conditions, setConditions] = React.useState(() => {
    const whereFromSearch = searchParams.where
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

  const addCondition = React.useCallback(
    ({ andIndex, fieldName, orIndex, relation }) => {
      const newConditions = [...conditions]
      if (relation === 'and') {
        newConditions[orIndex].and.splice(andIndex, 0, { [fieldName]: {} })
      } else {
        newConditions.push({
          and: [
            {
              [fieldName]: {},
            },
          ],
        })
      }
      setConditions(newConditions)
    },
    [conditions],
  )

  const updateCondition = React.useCallback(
    ({ andIndex, fieldName, operator, orIndex, value: valueArg }) => {
      const existingRowCondition = conditions[orIndex].and[andIndex]
      if (typeof existingRowCondition === 'object' && fieldName && operator) {
        const value = valueArg ?? (operator ? existingRowCondition[operator] : '')
        const newRowCondition = {
          [fieldName]: operator ? { [operator]: value } : {},
        }

        if (JSON.stringify(existingRowCondition) !== JSON.stringify(newRowCondition)) {
          conditions[orIndex].and[andIndex] = newRowCondition
          setConditions(conditions)
          if (![null, undefined].includes(value)) {
            // only update query when field/operator/value are filled out
            setShouldUpdateQuery(true)
          }
        }
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

  React.useEffect(() => {
    if (shouldUpdateQuery) {
      async function handleChange() {
        await handleWhereChange({ or: conditions })
        setShouldUpdateQuery(false)
      }
      void handleChange()
    }
  }, [conditions, handleWhereChange, shouldUpdateQuery])

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
                        const initialFieldName = Object.keys(conditions[orIndex].and[andIndex])[0]
                        const initialOperator =
                          (Object.keys(
                            conditions[orIndex].and[andIndex]?.[initialFieldName] || {},
                          )?.[0] as Operator) || undefined
                        const initialValue =
                          conditions[orIndex].and[andIndex]?.[initialFieldName]?.[
                            initialOperator
                          ] || ''

                        return (
                          <li key={andIndex}>
                            {andIndex !== 0 && (
                              <div className={`${baseClass}__label`}>{t('general:and')}</div>
                            )}
                            <Condition
                              addCondition={addCondition}
                              andIndex={andIndex}
                              fieldName={initialFieldName}
                              fields={reducedFields}
                              initialValue={initialValue}
                              operator={initialOperator}
                              orIndex={orIndex}
                              removeCondition={removeCondition}
                              updateCondition={updateCondition}
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
                fieldName: reducedFields[0].value,
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
                  fieldName: reducedFields[0].value,
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
