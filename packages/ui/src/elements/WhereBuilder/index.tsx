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
    onChange,
    onClose,
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

  const fieldPermissions = permissions?.collections?.[collectionSlug]?.fields

  const reducedFields = useMemo(
    () =>
      reduceFieldsToOptions({
        fieldPermissions,
        fields: fields ?? [],
        i18n,
      }),
    [fieldPermissions, fields, i18n],
  )

  const firstField = useMemo(
    () => reducedFields.find((f) => !isFieldDisabled(f.field, 'filter')),
    [reducedFields],
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

  const handleWhereChange = useMemo(
    () =>
      isFormMode
        ? (where: { or: typeof conditions }) => {
            onChange?.(where)
          }
        : listQuery.handleWhereChange,
    [isFormMode, onChange, listQuery.handleWhereChange],
  )

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
      // Virtual first row: conditions not yet committed, build from scratch
      if (conditions.length === 0) {
        const { validOperator } = getValidFieldOperators({
          field: field.field,
          operator: incomingOperator,
        })
        await handleWhereChange({
          or: [{ and: [{ [String(field.fieldPath)]: { [validOperator]: value } }] }],
        })
        return
      }

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
      // Virtual first row: removing it just closes the panel
      if (conditions.length === 0) {
        onClose?.()
        return
      }

      const newConditions = [...conditions]
      newConditions[orIndex].and.splice(andIndex, 1)

      if (newConditions[orIndex].and.length === 0) {
        newConditions.splice(orIndex, 1)
      }

      await handleWhereChange({ or: newConditions })

      // Removing the last remaining condition closes the filters panel.
      if (newConditions.length === 0) {
        onClose?.()
      }
    },
    [conditions, handleWhereChange, onClose],
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
    if (!firstField) {
      return
    }

    // With no committed conditions, only the virtual placeholder row is shown. Commit it
    // and append a new row so a second row appears on the first click.
    if (conditions.length === 0) {
      const defaultOperator = firstField.operators[0].value
      const makeRow = () => ({
        and: [{ [String(firstField.fieldPath)]: { [defaultOperator]: undefined } }],
      })

      await handleWhereChange({ or: [makeRow(), makeRow()] })
      return
    }

    await addCondition({
      andIndex: 0,
      field: firstField,
      orIndex: conditions.length,
      relation: 'or',
    })
  }, [addCondition, conditions.length, firstField, handleWhereChange])

  // When conditions is empty, show a virtual first row so the panel never opens blank.
  const displayConditions =
    conditions.length === 0 && firstField
      ? ([
          { and: [{ [firstField.fieldPath]: { [firstField.operators[0].value]: undefined } }] },
        ] as typeof conditions)
      : conditions

  return (
    <div className={[baseClass, isFormMode && `${baseClass}--form-mode`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__or-filters`}>
        {displayConditions.map((or, orIndex) => {
          const compoundOrKey = `${orIndex}_${Array.isArray(or?.and) ? or.and.length : ''}`

          return (
            <div className={`${baseClass}__and-filters`} key={compoundOrKey}>
              {Array.isArray(or?.and) &&
                or.and.map((_, andIndex) => {
                  const condition = displayConditions[orIndex].and[andIndex]
                  const fieldPath = Object.keys(condition)[0]

                  const operator =
                    (Object.keys(condition?.[fieldPath] || {})?.[0] as Operator) || undefined

                  const value = condition?.[fieldPath]?.[operator] || undefined

                  const isFirstCondition = orIndex === 0 && andIndex === 0
                  const join: 'and' | 'or' = andIndex === 0 ? 'or' : 'and'

                  return (
                    <Condition
                      addCondition={addCondition}
                      andIndex={andIndex}
                      fieldPath={fieldPath}
                      filterOptions={resolvedFilterOptions?.get(fieldPath)}
                      isFirstCondition={isFirstCondition}
                      join={join}
                      key={andIndex}
                      operator={operator}
                      orIndex={orIndex}
                      reducedFields={reducedFields}
                      removeCondition={removeCondition}
                      RenderedFilter={renderedFilters?.get(fieldPath)}
                      updateCondition={updateCondition}
                      updateJoin={updateJoin}
                      value={value}
                    />
                  )
                })}
            </div>
          )
        })}
        <div className={`${baseClass}__add-or-row`}>
          <Button
            buttonStyle="ghost"
            className={`${baseClass}__add-or`}
            icon={<CirclePlusIcon size={24} />}
            iconPosition="left"
            onClick={addFirstFilter}
          >
            {t('general:addFilter')}
          </Button>
        </div>
      </div>
    </div>
  )
}
