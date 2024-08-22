'use client'

import type { UploadFieldProps } from 'payload'

import React, { useCallback, useMemo } from 'react'

import type { UploadInputProps } from './HasOne/Input.js'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { UploadComponentHasMany } from './HasMany/index.js'
import { UploadInputHasOne } from './HasOne/Input.js'
import { UploadComponentHasOne } from './HasOne/index.js'

export { UploadFieldProps, UploadInputHasOne as UploadInput }
export type { UploadInputProps }

export const baseClass = 'upload'

const UploadComponent: React.FC<UploadFieldProps> = (props) => {
  const {
    field: {
      _path: pathFromProps,
      admin: { readOnly: readOnlyFromAdmin } = {},
      hasMany,
      relationTo,
      required,
    },
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const { permissions } = useAuth()

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  // Checks if the user has permissions to create a new document in the related collection
  const canCreate = useMemo(() => {
    if (typeof relationTo === 'string') {
      if (permissions?.collections && permissions.collections?.[relationTo]?.create) {
        if (permissions.collections[relationTo].create?.permission === true) {
          return true
        }
      }
    }

    return false
  }, [relationTo, permissions])

  const fieldHookResult = useField<string | string[]>({
    path: pathFromContext ?? pathFromProps,
    validate: memoizedValidate,
  })

  const setValue = useMemo(() => fieldHookResult.setValue, [fieldHookResult])

  const disabled =
    readOnlyFromProps ||
    readOnlyFromContext ||
    fieldHookResult.formProcessing ||
    fieldHookResult.formInitializing

  const onChange = useCallback(
    (incomingValue) => {
      const incomingID = incomingValue?.id || incomingValue
      setValue(incomingID)
    },
    [setValue],
  )

  if (hasMany) {
    return (
      <UploadComponentHasMany
        {...props}
        canCreate={canCreate}
        disabled={disabled}
        // Note: the below TS error is thrown bc the field hook return result varies based on `hasMany`
        // @ts-expect-error
        fieldHookResult={fieldHookResult}
        onChange={onChange}
      />
    )
  }

  return (
    <UploadComponentHasOne
      {...props}
      canCreate={canCreate}
      disabled={disabled}
      // Note: the below TS error is thrown bc the field hook return result varies based on `hasMany`
      // @ts-expect-error
      fieldHookResult={fieldHookResult}
      onChange={onChange}
    />
  )
}

export const UploadField = withCondition(UploadComponent)
