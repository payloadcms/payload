'use client'

import type { UploadFieldProps } from 'payload'

import React, { useCallback, useMemo } from 'react'

import type { UploadInputProps } from './Input.js'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { UploadInput } from './Input.js'
import './index.scss'

export { UploadFieldProps, UploadInput }
export type { UploadInputProps }

const UploadComponent: React.FC<UploadFieldProps> = (props) => {
  const {
    field,
    field: {
      _path: pathFromProps,
      admin: { className, readOnly: readOnlyFromProps, style, width },
      label,
      relationTo,
      required,
    },
    validate,
  } = props

  const {
    config: {
      collections,
      routes: { api: apiRoute },
      serverURL,
    },
  } = useConfig()

  const { permissions } = useAuth()

  const collection = collections.find((coll) => coll.slug === relationTo)

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
    if (permissions?.collections && permissions.collections?.[relationTo]?.create) {
      if (permissions.collections[relationTo].create?.permission === true) {
        return true
      }
    }

    return false
  }, [relationTo, permissions])

  const { filterOptions, formInitializing, formProcessing, setValue, showError, value } =
    useField<string>({
      path: pathFromContext ?? pathFromProps,
      validate: memoizedValidate,
    })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const onChange = useCallback(
    (incomingValue) => {
      const incomingID = incomingValue?.id || incomingValue
      setValue(incomingID)
    },
    [setValue],
  )

  if (collection.upload) {
    return (
      <UploadInput
        Description={field?.admin?.components?.Description}
        Error={field?.admin?.components?.Error}
        Label={field?.admin?.components?.Label}
        allowNewUpload={canCreate}
        api={apiRoute}
        className={className}
        collection={collection}
        filterOptions={filterOptions}
        label={label}
        onChange={onChange}
        readOnly={disabled}
        relationTo={relationTo}
        required={required}
        serverURL={serverURL}
        showError={showError}
        style={style}
        value={value}
        width={width}
      />
    )
  }

  return null
}

export const UploadField = withCondition(UploadComponent)
