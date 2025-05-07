'use client'
import type { RelationshipFieldClientComponent, ValueWithRelation } from 'payload'

import React, { useCallback, useMemo } from 'react'

import type { Value } from './types.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import { RelationshipInput } from './Input.js'
import './index.scss'

const RelationshipFieldComponent: RelationshipFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: {
        allowCreate = true,
        allowEdit = true,
        appearance = 'select',
        className,
        description,
        isSortable = true,
        placeholder,
        sortOptions,
      } = {},
      hasMany,
      label,
      localized,
      relationTo,
      required,
    },
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, required })
      }
    },
    [validate, required],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    filterOptions,
    initialValue,
    path,
    setValue,
    showError,
    value,
  } = useField<Value | Value[]>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const styles = useMemo(() => mergeFieldStyles(field), [field])
  const isPolymorphic = Array.isArray(relationTo)
  const safeRelationTo = Array.isArray(relationTo) ? relationTo : [relationTo]

  const handleChangeHasMulti = useCallback(
    (value: ValueWithRelation[], disableModifyForm?: boolean) => {
      if (!value) {
        setValue(null, Boolean(disableModifyForm))
        return
      }

      const dataToSet = value.map((val) => {
        if (isPolymorphic) {
          return val
        } else {
          return val.value
        }
      })

      setValue(dataToSet, Boolean(disableModifyForm))
    },
    [isPolymorphic, setValue],
  )

  const handleChangeSingle = useCallback(
    (value: ValueWithRelation, disableModifyForm?: boolean) => {
      if (!value) {
        setValue(null, Boolean(disableModifyForm))
        return
      }

      if (isPolymorphic) {
        setValue(value, Boolean(disableModifyForm))
      } else {
        setValue(value.value, Boolean(disableModifyForm))
      }
    },
    [isPolymorphic, setValue],
  )

  const sharedProps = {
    AfterInput,
    allowCreate,
    allowEdit,
    appearance,
    BeforeInput,
    className,
    Description,
    description,
    Error,
    filterOptions,
    initialValue,
    isPolymorphic: Array.isArray(relationTo),
    isSortable,
    Label,
    label,
    localized,
    maxResultsPerRequest: 10,
    maxRows: field?.maxRows,
    minRows: field?.minRows,
    path,
    readOnly: readOnly || disabled,
    relationTo: safeRelationTo,
    required,
    showError,
    sortOptions: sortOptions as any, // todo: fix this, handle Record<string, string> type
    style: styles,
  }

  if (hasMany) {
    return (
      <RelationshipInput
        {...sharedProps}
        hasMany={true}
        onChange={handleChangeHasMulti}
        value={
          value
            ? (Array.isArray(value) ? value : [value]).map((val) => {
                if (isPolymorphic) {
                  return val as ValueWithRelation
                } else {
                  return {
                    relationTo: safeRelationTo[0],
                    value: val as ValueWithRelation['value'],
                  }
                }
              })
            : null
        }
      />
    )
  }

  return (
    <RelationshipInput
      {...sharedProps}
      hasMany={false}
      onChange={handleChangeSingle}
      value={
        value
          ? isPolymorphic
            ? (value as ValueWithRelation)
            : {
                relationTo: safeRelationTo[0],
                value: value as ValueWithRelation['value'],
              }
          : null
      }
    />
  )
}

export const RelationshipField = withCondition(RelationshipFieldComponent)
