'use client'
import type { RelationshipFieldClientComponent, ValueWithRelation } from 'payload'

import React, { useCallback, useMemo } from 'react'

import type { Value } from './types.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import { RelationshipInput } from './Input.js'
import './index.scss'

export { RelationshipInput }

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
      relationTo: relationToProp,
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
  const isPolymorphic = Array.isArray(relationToProp)
  const [relationTo] = React.useState(() =>
    Array.isArray(relationToProp) ? relationToProp : [relationToProp],
  )

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

  const memoizedValue: ValueWithRelation | ValueWithRelation[] = React.useMemo(() => {
    if (hasMany === true) {
      return (
        Array.isArray(value)
          ? value.map((val) => {
              return isPolymorphic
                ? val
                : {
                    relationTo: Array.isArray(relationTo) ? relationTo[0] : relationTo,
                    value: val,
                  }
            })
          : value
      ) as ValueWithRelation[]
    } else {
      return (
        value
          ? isPolymorphic
            ? value
            : {
                relationTo: Array.isArray(relationTo) ? relationTo[0] : relationTo,
                value,
              }
          : value
      ) as ValueWithRelation
    }
  }, [hasMany, value, isPolymorphic, relationTo])

  const memoizedInitialValue: ValueWithRelation | ValueWithRelation[] = React.useMemo(() => {
    if (hasMany === true) {
      return (
        Array.isArray(initialValue)
          ? initialValue.map((val) => {
              return isPolymorphic
                ? val
                : {
                    relationTo: Array.isArray(relationTo) ? relationTo[0] : relationTo,
                    value: val,
                  }
            })
          : initialValue
      ) as ValueWithRelation[]
    } else {
      return (
        initialValue
          ? isPolymorphic
            ? initialValue
            : {
                relationTo: Array.isArray(relationTo) ? relationTo[0] : relationTo,
                value: initialValue,
              }
          : initialValue
      ) as ValueWithRelation
    }
  }, [initialValue, isPolymorphic, relationTo, hasMany])

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
    isSortable,
    Label,
    label,
    localized,
    maxResultsPerRequest: 10,
    maxRows: field?.maxRows,
    minRows: field?.minRows,
    path,
    placeholder,
    readOnly: readOnly || disabled,
    relationTo,
    required,
    showError,
    sortOptions: sortOptions as any, // todo: fix this, handle Record<string, string> type
    style: styles,
  }

  return (
    <RelationshipInput
      {...sharedProps}
      {...(hasMany === true
        ? {
            hasMany: true,
            initialValue: memoizedInitialValue as ValueWithRelation[],
            onChange: handleChangeHasMulti,
            value: memoizedValue as ValueWithRelation[],
          }
        : {
            hasMany: false,
            initialValue: memoizedInitialValue as ValueWithRelation,
            onChange: handleChangeSingle,
            value: memoizedValue as ValueWithRelation,
          })}
    />
  )
}

export const RelationshipField = withCondition(RelationshipFieldComponent)
