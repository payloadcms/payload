'use client'
import type { Operator } from 'payload'

import { dequal } from 'dequal/lite'
import { isFieldDisabled, transformWhereQuery, validateWhereQuery } from 'payload/shared'
import React, { useMemo } from 'react'

import type {
  AddCondition,
  RemoveCondition,
  UpdateCondition,
  UpdateJoin,
  WhereBuilderProps,
} from './types.js'

import { CirclePlusIcon } from '../../icons/CirclePlus/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js'
import { Button } from '../Button/index.js'
import { Condition } from './Condition/index.js'
import './index.css'
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
    collectionSlug,
    fields: fieldsProp,
    isWhereOpen,
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
          [String(field.fieldPath)]: {
            [defaultOperator]: undefined,
          },
        })
      } else {
        newConditions.push({
          and: [
            {
              [String(field.fieldPath)]: {
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

      if (typeof existingCondition === 'object' && field?.fieldPath) {
        const { validOperator } = getValidFieldOperators({
          field: field.field,
          operator: incomingOperator,
        })

        // Skip if nothing changed
        const existingValue = existingCondition[String(field.fieldPath)]?.[validOperator]
        if (typeof existingValue !== 'undefined' && existingValue === value) {
          return
        }

        const newRowCondition = {
          [String(field.fieldPath)]: { [validOperator]: value },
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

  const updateJoin: UpdateJoin = React.useCallback(
    async ({ andIndex, join, orIndex }) => {
      // Flatten the nested or/and structure into a single ordered list, tracking
      // the join relation that connects each condition to the previous one.
      const flattened: { cond: (typeof conditions)[number]['and'][number]; join: 'and' | 'or' }[] =
        []

      conditions.forEach((orGroup, oIdx) => {
        orGroup.and.forEach((cond, aIdx) => {
          const isTarget = oIdx === orIndex && aIdx === andIndex
          const currentJoin = flattened.length === 0 ? null : aIdx === 0 ? 'or' : 'and'

          flattened.push({ cond, join: isTarget ? join : currentJoin })
        })
      })

      // Rebuild the or/and structure from the flattened list using the join relations.
      const newConditions: typeof conditions = []

      flattened.forEach(({ cond, join: itemJoin }, index) => {
        if (index === 0 || itemJoin === 'or') {
          newConditions.push({ and: [cond] })
        } else {
          newConditions[newConditions.length - 1].and.push(cond)
        }
      })

      await handleWhereChange({ or: newConditions })
    },
    [conditions, handleWhereChange],
  )

  const addFirstFilter = React.useCallback(async () => {
    const field = reducedFields.find((field) => !isFieldDisabled(field.field, 'filter'))

    if (field) {
      await addCondition({
        andIndex: 0,
        field,
        orIndex: conditions.length,
        relation: 'or',
      })
    }
  }, [addCondition, conditions.length, reducedFields])

  // When the filters panel is opened with no conditions, automatically add a first row.
  const wasWhereOpen = React.useRef(isWhereOpen)

  React.useEffect(() => {
    if (isWhereOpen && !wasWhereOpen.current && conditions.length === 0) {
      void addFirstFilter()
    }

    wasWhereOpen.current = isWhereOpen
  }, [isWhereOpen, conditions.length, addFirstFilter])

  return (
    <div className={baseClass}>
      {conditions.length > 0 && (
        <React.Fragment>
          <ul className={`${baseClass}__or-filters`}>
            {conditions.map((or, orIndex) => {
              const compoundOrKey = `${orIndex}_${Array.isArray(or?.and) ? or.and.length : ''}`

              return (
                <li key={compoundOrKey}>
                  <ul className={`${baseClass}__and-filters`}>
                    {Array.isArray(or?.and) &&
                      or.and.map((_, andIndex) => {
                        const condition = conditions[orIndex].and[andIndex]
                        const fieldPath = Object.keys(condition)[0]

                        const operator =
                          (Object.keys(condition?.[fieldPath] || {})?.[0] as Operator) || undefined

                        const value = condition?.[fieldPath]?.[operator] || undefined

                        const isFirstCondition = orIndex === 0 && andIndex === 0
                        const join: 'and' | 'or' = andIndex === 0 ? 'or' : 'and'

                        return (
                          <li key={andIndex}>
                            <Condition
                              addCondition={addCondition}
                              andIndex={andIndex}
                              fieldPath={fieldPath}
                              filterOptions={resolvedFilterOptions?.get(fieldPath)}
                              isFirstCondition={isFirstCondition}
                              join={join}
                              operator={operator}
                              orIndex={orIndex}
                              reducedFields={reducedFields}
                              removeCondition={removeCondition}
                              RenderedFilter={renderedFilters?.get(fieldPath)}
                              updateCondition={updateCondition}
                              updateJoin={updateJoin}
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
            buttonStyle="ghost"
            className={`${baseClass}__add-or`}
            icon={<CirclePlusIcon size={24} />}
            iconPosition="left"
            onClick={addFirstFilter}
          >
            {t('general:addFilter')}
          </Button>
        </React.Fragment>
      )}
    </div>
  )
}
