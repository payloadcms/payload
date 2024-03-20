import type { Where } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import { flattenTopLevelFields } from 'payload/utilities'
import React, { useReducer, useState } from 'react'

import type { Props } from './types.js'

import { useListInfo } from '../../index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useSearchParams } from '../../providers/SearchParams/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import Condition from './Condition/index.js'
import fieldTypes from './field-types.js'
import './index.scss'
import reducer from './reducer.js'
import { transformWhereQuery } from './transformWhereQuery.js'
import validateWhereQuery from './validateWhereQuery.js'

const baseClass = 'where-builder'

const reduceFields = (fields, i18n) =>
  flattenTopLevelFields(fields).reduce((reduced, field) => {
    if (typeof fieldTypes[field.type] === 'object') {
      const operatorKeys = new Set()
      const operators = fieldTypes[field.type].operators.reduce((acc, operator) => {
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
        operators,
        props: {
          ...field,
        },
      }

      return [...reduced, formattedField]
    }

    return reduced
  }, [])

/**
 * The WhereBuilder component is used to render the filter controls for a collection's list view.
 * It is part of the {@link ListControls} component which is used to render the controls (search, filter, where).
 */
const WhereBuilder: React.FC<Props> = (props) => {
  const { collectionPluralLabel, collectionSlug } = props
  const { i18n, t } = useTranslation()

  const config = useConfig()
  const collection = config.collections.find((c) => c.slug === collectionSlug)
  const [reducedFields] = useState(() => reduceFields(collection.fields, i18n))

  const { searchParams } = useSearchParams()
  const { handleWhereChange } = useListInfo()

  // This handles initializing the where conditions from the search query (URL). That way, if you pass in
  // query params to the URL, the where conditions will be initialized from those and displayed in the UI.
  // Example: /admin/collections/posts?where[or][0][and][0][text][equals]=example%20post
  const [conditions, dispatchConditions] = useReducer(
    reducer,
    searchParams.where as Where,
    (whereFromSearch: Where) => {
      if (whereFromSearch) {
        if (validateWhereQuery(whereFromSearch)) {
          return whereFromSearch.or
        }

        // Transform the where query to be in the right format. This will transform something simple like [text][equals]=example%20post to the right format
        const transformedWhere = transformWhereQuery(whereFromSearch)

        if (validateWhereQuery(transformedWhere)) {
          return transformedWhere.or
        }

        console.warn(`Invalid where query in URL: ${JSON.stringify(whereFromSearch)}`)
      }
      return []
    },
  )

  React.useEffect(() => {
    handleWhereChange({
      or: conditions,
    })
  }, [conditions, handleWhereChange])

  return (
    <div className={baseClass}>
      {conditions.length > 0 && (
        <React.Fragment>
          <div className={`${baseClass}__label`}>
            {t('general:filterWhere', { label: getTranslation(collectionPluralLabel, i18n) })}
          </div>
          <ul className={`${baseClass}__or-filters`}>
            {conditions.map((or, orIndex) => (
              <li key={orIndex}>
                {orIndex !== 0 && <div className={`${baseClass}__label`}>{t('general:or')}</div>}
                <ul className={`${baseClass}__and-filters`}>
                  {Array.isArray(or?.and) &&
                    or.and.map((_, andIndex) => (
                      <li key={andIndex}>
                        {andIndex !== 0 && (
                          <div className={`${baseClass}__label`}>{t('general:and')}</div>
                        )}
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
              if (reducedFields.length > 0)
                dispatchConditions({ type: 'add', field: reducedFields[0].value })
            }}
          >
            {t('general:addFilter')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default WhereBuilder
