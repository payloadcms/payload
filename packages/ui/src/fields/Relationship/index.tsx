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
  } = useField<Value>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const styles = useMemo(() => mergeFieldStyles(field), [field])
  const isPolymorphic = Array.isArray(relationToProp)
  const [relationTo] = React.useState(() =>
    Array.isArray(relationToProp) ? relationToProp : [relationToProp],
  )

  const handleChangeHasMulti = useCallback(
    (newValue: ValueWithRelation[]) => {
      if (!newValue) {
        setValue(null, newValue === value)
        return
      }

      let disableFormModification = false
      if (isPolymorphic) {
        disableFormModification =
          Array.isArray(value) &&
          Array.isArray(newValue) &&
          value.length === newValue.length &&
          (value as ValueWithRelation[]).every((val, idx) => {
            const newVal = newValue[idx]
            return val.value === newVal.value && val.relationTo === newVal.relationTo
          })
      } else {
        disableFormModification =
          Array.isArray(value) &&
          Array.isArray(newValue) &&
          value.length === newValue.length &&
          value.every((val, idx) => val === newValue[idx].value)
      }

      const dataToSet = newValue.map((val) => {
        if (isPolymorphic) {
          return val
        } else {
          return val.value
        }
      })

      setValue(dataToSet, disableFormModification)
    },
    [isPolymorphic, setValue, value],
  )

  const handleChangeSingle = useCallback(
    (newValue: ValueWithRelation) => {
      if (!newValue) {
        setValue(null, newValue === value)
        return
      }

      let disableFormModification = false
      if (isPolymorphic) {
        disableFormModification =
          value &&
          newValue &&
          (value as ValueWithRelation).value === newValue.value &&
          (value as ValueWithRelation).relationTo === newValue.relationTo
      } else {
        disableFormModification = value && newValue && value === newValue.value
      }

      const dataToSet = isPolymorphic ? newValue : newValue.value
      setValue(dataToSet, disableFormModification)
    },
    [isPolymorphic, setValue, value],
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

  return (
    <RelationshipInput
      AfterInput={AfterInput}
      allowCreate={allowCreate}
      allowEdit={allowEdit}
      appearance={appearance}
      BeforeInput={BeforeInput}
      className={className}
      Description={Description}
      description={description}
      Error={Error}
      filterOptions={filterOptions}
      formatDisplayedOptions={
        isPolymorphic ? undefined : (options) => options.map((opt) => opt.options).flat()
      }
      isSortable={isSortable}
      Label={Label}
      label={label}
      localized={localized}
      maxResultsPerRequest={10}
      maxRows={field?.maxRows}
      minRows={field?.minRows}
      path={path}
      placeholder={placeholder}
      readOnly={readOnly || disabled}
      relationTo={relationTo}
      required={required}
      showError={showError}
      sortOptions={sortOptions as any}
      style={styles}
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
