import queryString from 'qs'
import React, { useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import type { Where } from '../../../../types'
import type { Props } from './types'

import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields'
import { getTranslation } from '../../../../utilities/getTranslation'
import useThrottledEffect from '../../../hooks/useThrottledEffect'
import { useSearchParams } from '../../utilities/SearchParams'
import Button from '../Button'
import Condition from './Condition'
import fieldTypes from './field-types'
import './index.scss'
import reducer from './reducer'
import { transformWhereQuery } from './transformWhereQuery'
import validateWhereQuery from './validateWhereQuery'

const baseClass = 'where-builder'

const reduceFields = (fields, i18n) =>
  flattenTopLevelFields(fields).reduce((reduced, field) => {
    let operators = []

    if (typeof fieldTypes[field.type] === 'object') {
      if (typeof fieldTypes[field.type].operators === 'function') {
        operators = fieldTypes[field.type].operators(
          'hasMany' in field && field.hasMany ? true : false,
        )
      } else {
        operators = fieldTypes[field.type].operators
      }

      const operatorKeys = new Set()
      const reducedOperators = operators.reduce((acc, operator) => {
        if (!operatorKeys.has(operator.value)) {
          operatorKeys.add(operator.value)
          return [
            ...acc,
            {
              ...operator,
              label: i18n.t(`operators:${operator.label}`),
            },
          ]
        }
        return acc
      }, [])

      const formattedField = {
        label: getTranslation(field.label || field.name, i18n),
        value: field.name,
        ...fieldTypes[field.type],
        operators: reducedOperators,
        props: {
          ...field,
        },
      }

      if (field.admin && 'disableListFilter' in field.admin && field.admin?.disableListFilter)
        return reduced

      return [...reduced, formattedField]
    }

    return reduced
  }, [])

/**
 * The WhereBuilder component is used to render the filter controls for a collection's list view.
 * It is part of the {@link ListControls} component which is used to render the controls (search, filter, where).
 */
const WhereBuilder: React.FC<Props> = (props) => {
  const {
    collection: { labels: { plural } = {} } = {},
    collection,
    handleChange,
    modifySearchQuery = true,
  } = props

  const history = useHistory()
  const params = useSearchParams()
  const { i18n, t } = useTranslation('general')

  // This handles initializing the where conditions from the search query (URL). That way, if you pass in
  // query params to the URL, the where conditions will be initialized from those and displayed in the UI.
  // Example: /admin/collections/posts?where[or][0][and][0][text][equals]=example%20post
  const [conditions, dispatchConditions] = useReducer(reducer, params.where, (whereFromSearch) => {
    if (modifySearchQuery && whereFromSearch) {
      if (validateWhereQuery(whereFromSearch)) {
        return whereFromSearch.or
      }

      // Transform the where query to be in the right format. This will transform something simple like [text][equals]=example%20post to the right format
      const transformedWhere = transformWhereQuery(whereFromSearch)

      if (validateWhereQuery(transformedWhere)) {
        return transformedWhere.or
      }

      console.warn('Invalid where query in URL. Ignoring.')
    }
    return []
  })

  const [reducedFields] = useState(() => reduceFields(collection.fields, i18n))

  // This handles updating the search query (URL) when the where conditions change
  useThrottledEffect(
    () => {
      const currentParams = queryString.parse(history.location.search, {
        depth: 10,
        ignoreQueryPrefix: true,
      }) as { where: Where }

      const paramsToKeep =
        typeof currentParams?.where === 'object' && 'or' in currentParams.where
          ? currentParams.where.or.reduce((keptParams, param) => {
              const newParam = { ...param }
              if (param.and) {
                delete newParam.and
              }
              return [...keptParams, newParam]
            }, [])
          : []

      const hasNewWhereConditions = conditions.length > 0

      const newWhereQuery = {
        ...(typeof currentParams?.where === 'object' &&
        (validateWhereQuery(currentParams?.where) || !hasNewWhereConditions)
          ? currentParams.where
          : {}),
        or: [...conditions, ...paramsToKeep],
      }

      const reducedQuery = {
        or: newWhereQuery.or.map((orCondition) => {
          const andConditions = (orCondition.and || []).map((andCondition) => {
            const reducedCondition = {}
            Object.entries(andCondition).forEach(([fieldName, fieldValue]) => {
              Object.entries(fieldValue).forEach(([operatorKey, operatorValue]) => {
                reducedCondition[fieldName] = {}
                reducedCondition[fieldName][operatorKey] = !operatorValue
                  ? undefined
                  : operatorValue
              })
            })
            return reducedCondition
          })
          return {
            and: andConditions,
          }
        }),
      }

      if (handleChange) handleChange(newWhereQuery as Where)

      const hasExistingConditions =
        typeof currentParams?.where === 'object' && 'or' in currentParams.where

      if (
        modifySearchQuery &&
        ((hasExistingConditions && !hasNewWhereConditions) || hasNewWhereConditions)
      ) {
        history.replace({
          search: queryString.stringify(
            {
              ...currentParams,
              page: 1,
              where: reducedQuery,
            },
            { addQueryPrefix: true },
          ),
        })
      }
    },
    500,
    [conditions, modifySearchQuery, handleChange],
  )

  return (
    <div className={baseClass}>
      {conditions.length > 0 && (
        <React.Fragment>
          <div className={`${baseClass}__label`}>
            {t('filterWhere', { label: getTranslation(plural, i18n) })}
          </div>
          <ul className={`${baseClass}__or-filters`}>
            {conditions.map((or, orIndex) => (
              <li key={orIndex}>
                {orIndex !== 0 && <div className={`${baseClass}__label`}>{t('or')}</div>}
                <ul className={`${baseClass}__and-filters`}>
                  {Array.isArray(or?.and) &&
                    or.and.map((_, andIndex) => (
                      <li key={andIndex}>
                        {andIndex !== 0 && <div className={`${baseClass}__label`}>{t('and')}</div>}
                        <Condition
                          andIndex={andIndex}
                          dispatch={dispatchConditions}
                          fields={reducedFields}
                          key={andIndex}
                          orIndex={orIndex}
                          value={conditions[orIndex].and[andIndex]}
                        />
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__add-or`}
            icon="plus"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => {
              if (reducedFields.length > 0)
                dispatchConditions({ type: 'add', field: reducedFields[0].value })
            }}
          >
            {t('or')}
          </Button>
        </React.Fragment>
      )}
      {conditions.length === 0 && (
        <div className={`${baseClass}__no-filters`}>
          <div className={`${baseClass}__label`}>{t('noFiltersSet')}</div>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__add-first-filter`}
            icon="plus"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => {
              if (reducedFields.length > 0)
                dispatchConditions({ type: 'add', field: reducedFields[0].value })
            }}
          >
            {t('addFilter')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default WhereBuilder
