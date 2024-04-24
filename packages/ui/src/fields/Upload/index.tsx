'use client'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { withCondition } from '@payloadcms/ui/forms/withCondition'
import React, { useCallback } from 'react'

import type { UploadInputProps } from './Input.js'
import type { UploadFieldProps } from './types.js'

import { useField } from '../../forms/useField/index.js'
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

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()
  const readOnly = readOnlyFromProps || readOnlyFromContext

  const { filterOptions, path, setValue, showError, value } = useField<string>({
    path: pathFromContext || pathFromProps,
    validate,
  })

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
        readOnly={readOnly}
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
