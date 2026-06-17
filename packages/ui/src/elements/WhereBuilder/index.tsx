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
import { useTranslation } from '../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js'
import { Button } from '../Button/index.js'
import { Condition } from './Condition/index.js'
import './index.css'
import { fieldTypeConditions, getValidFieldOperators } from './field-types.js'

const baseClass = 'where-builder'

export { WhereBuilderProps }

/**
 * Presentational filter builder. It renders the conditions described by `value` and
 * reports edits through `onChange`. It is unaware of where its value is stored — the
 * list view wires it to list query state via {@link ListWhereBuilder}, and the Query
 * Presets drawer wires it to form state.
 */
export const WhereBuilder: React.FC<WhereBuilderProps> = (props) => {
  const {
    collectionSlug,
    fields,
    onChange,
    onClose,
    renderedFilters = undefined,
    resolvedFilterOptions = undefined,
    value,
  } = props
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()

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
    if (value) {
      if (validateWhereQuery(value)) {
        return value.or ?? []
      }

      const transformedWhere = transformWhereQuery(value)
      if (validateWhereQuery(transformedWhere)) {
        return transformedWhere.or ?? []
      }
    }

    return []
  }, [value])

  // Reports edits to the parent. Aliased so the callbacks below read clearly.
  const handleWhereChange = onChange

  const addCondition: AddCondition = React.useCallback(
    ({ andIndex, field, orIndex, relation }) => {
      const newConditions = structuredClone(conditions)

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

      void handleWhereChange({ or: newConditions })
    },
    [conditions, handleWhereChange],
  )

  const updateCondition: UpdateCondition = React.useCallback(
    ({ andIndex, field, operator: incomingOperator, orIndex, value }) => {
      // Virtual first row: conditions not yet committed, build from scratch
      if (conditions.length === 0) {
        // Nothing to commit until the placeholder row has an actual value. This also prevents a
        // cleared row from immediately re-committing itself as an empty condition.
        if (value === undefined || value === null || value === '') {
          return
        }

        const { validOperator } = getValidFieldOperators({
          field: field.field,
          operator: incomingOperator,
        })
        void handleWhereChange({
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

        const newConditions = structuredClone(conditions)
        newConditions[orIndex].and[andIndex] = newRowCondition

        void handleWhereChange({ or: newConditions })
      }
    },
    [conditions, handleWhereChange],
  )

  const removeCondition: RemoveCondition = React.useCallback(
    ({ andIndex, orIndex }) => {
      // Virtual first row: removing it just closes the panel
      if (conditions.length === 0) {
        onClose?.()
        return
      }

      const newConditions = structuredClone(conditions)
      newConditions[orIndex].and.splice(andIndex, 1)

      if (newConditions[orIndex].and.length === 0) {
        newConditions.splice(orIndex, 1)
      }

      void handleWhereChange({ or: newConditions })

      // Removing the last remaining condition closes the filters panel.
      if (newConditions.length === 0) {
        onClose?.()
      }
    },
    [conditions, handleWhereChange, onClose],
  )

  const updateJoin: UpdateJoin = React.useCallback(
    ({ andIndex, join, orIndex }) => {
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

      void handleWhereChange({ or: newConditions })
    },
    [conditions, handleWhereChange],
  )

  const addFirstFilter = React.useCallback(() => {
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

      void handleWhereChange({ or: [makeRow(), makeRow()] })
      return
    }

    void addCondition({
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

  // Show the per-row remove button only when removing does something meaningful: when there is
  // a committed condition to remove, or when the builder lives in a closable panel (the list
  // view), where removing the last row closes it. The uncommitted virtual placeholder row in
  // the always-open form (drawer) has nothing to remove, so it gets no button.
  const showRemoveButton = conditions.length > 0 || Boolean(onClose)

  return (
    <div className={baseClass}>
      <div
        className={[
          `${baseClass}__or-filters`,
          !showRemoveButton && `${baseClass}__or-filters--no-actions`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
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
                      showRemoveButton={showRemoveButton}
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
