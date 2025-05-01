import queryString from 'qs'
import React, { useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import type { Field } from '../../../../exports/types'
import type { Where } from '../../../../types'
import type { Props } from './types'

import { tabHasName } from '../../../../exports/types'
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields'
import { getTranslation } from '../../../../utilities/getTranslation'
import useThrottledEffect from '../../../hooks/useThrottledEffect'
import { createNestedFieldPath } from '../../forms/Form/createNestedFieldPath'
import { useSearchParams } from '../../utilities/SearchParams'
import Button from '../Button'
import { combineLabel } from '../FieldSelect'
import Condition from './Condition'
import fieldTypes from './field-types'
import './index.scss'
import reducer from './reducer'
import { transformWhereQuery } from './transformWhereQuery'
import validateWhereQuery from './validateWhereQuery'
const baseClass = 'where-builder'

export type ReduceClientFieldsArgs = {
  fields: Field[]
  i18n: any
  labelPrefix?: string
  pathPrefix?: string
}

const reduceFields = (fields, i18n, labelPrefix, pathPrefix) =>
  flattenTopLevelFields(fields).reduce((reduced, field) => {
    let operators = []

    if (field.admin && 'disableListFilter' in field.admin && field.admin?.disableListFilter)
      return reduced

    if (field.type === 'group' && 'fields' in field) {
      const translatedLabel = getTranslation(field.label || '', i18n)

      const labelWithPrefix = labelPrefix
        ? translatedLabel
          ? labelPrefix + ' > ' + translatedLabel
          : labelPrefix
        : translatedLabel

      const pathWithPrefix = field.name
        ? pathPrefix
          ? pathPrefix + '.' + field.name
          : field.name
        : pathPrefix

      reduced.push(...reduceFields(field.fields, i18n, labelWithPrefix, pathWithPrefix))
      return reduced
    }

    if (field.type === 'tab' && 'tabs' in field) {
      const tabs = field.tabs as Array<any>

      tabs.forEach((tab) => {
        if (typeof tab.label !== 'boolean') {
          const localizedTabLabel = getTranslation(tab.label, i18n)

          const labelWithPrefix = labelPrefix
            ? labelPrefix + ' > ' + localizedTabLabel
            : localizedTabLabel

          const tabPathPrefix =
            tabHasName(tab) && tab.name
              ? pathPrefix
                ? pathPrefix + '.' + tab.name
                : tab.name
              : pathPrefix

          if (typeof localizedTabLabel === 'string') {
            reduced.push(...reduceFields(tab.fields, i18n, labelWithPrefix, tabPathPrefix))
          }
        }
      })
      return reduced
    }

    if ((field.type as string) === 'row' && 'fields' in field) {
      reduced.push(...reduceFields(field.fields, i18n, labelPrefix, pathPrefix))
      return reduced
    }

    if ((field.type as string) === 'collapsible' && 'fields' in field) {
      const localizedTabLabel = getTranslation(field.label || '', i18n)

      const labelWithPrefix = labelPrefix
        ? labelPrefix + ' > ' + localizedTabLabel
        : localizedTabLabel

      reduced.push(...reduceFields(field.fields, i18n, labelWithPrefix, pathPrefix))
      return reduced
    }

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

      const localizedLabel = getTranslation(field.label || field.name, i18n)

      const formattedLabel = labelPrefix ? combineLabel(labelPrefix, field, i18n) : localizedLabel

      const formattedValue = pathPrefix
        ? createNestedFieldPath(pathPrefix, field as Field)
        : field.name

      const formattedField = {
        label: formattedLabel,
        value: formattedValue,
        ...fieldTypes[field.type],
        operators: reducedOperators,
        props: {
          ...field,
        },
      }

      reduced.push(formattedField)
      return reduced
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

  const [reducedFields] = useState(() => reduceFields(collection.fields, i18n, null, null))

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
                    or.and.map((_, andIndex) => {
                      const condition = conditions[orIndex].and[andIndex]
                      const fieldName = Object.keys(condition)[0]
                      const operator = Object.keys(condition?.[fieldName] || {})?.[0]
                      return (
                        <li key={andIndex}>
                          {andIndex !== 0 && (
                            <div className={`${baseClass}__label`}>{t('and')}</div>
                          )}
                          <Condition
                            andIndex={andIndex}
                            dispatch={dispatchConditions}
                            fields={reducedFields}
                            key={`${fieldName}-${operator}-${andIndex}-${orIndex}`}
                            orIndex={orIndex}
                            value={condition}
                          />
                        </li>
                      )
                    })}
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
