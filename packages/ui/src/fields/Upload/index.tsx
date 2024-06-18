'use client'

import React, { useCallback } from 'react'

import type { UploadInputProps } from './Input.js'
import type { UploadFieldProps } from './types.js'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { UploadInput } from './Input.js'
import './index.scss'

export { UploadFieldProps, UploadInput }
export type { UploadInputProps }

const _Upload: React.FC<UploadFieldProps> = (props) => {
  const {
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
    descriptionProps,
    errorProps,
    label,
    labelProps,
    path: pathFromProps,
    readOnly: readOnlyFromProps,
    relationTo,
    required,
    style,
    validate,
    width,
  } = props

  const {
    collections,
    routes: { api },
    serverURL,
  } = useConfig()

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

  const { filterOptions, formInitializing, formProcessing, path, setValue, showError, value } =
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
        CustomDescription={CustomDescription}
        CustomError={CustomError}
        CustomLabel={CustomLabel}
        api={api}
        className={className}
        collection={collection}
        descriptionProps={descriptionProps}
        errorProps={errorProps}
        filterOptions={filterOptions}
        label={label}
        labelProps={labelProps}
        onChange={onChange}
        path={path}
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

export const Upload = withCondition(_Upload)
