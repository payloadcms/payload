'use client'
import React, { useCallback } from 'react'

import type { Props } from './types.js'

import { useConfig } from '../../../providers/Config/index.js'
import LabelComp from '../../Label/index.js'
import { useField } from '../../useField/index.js'
import { UploadInput } from './Input.js'
import './index.scss'

const Upload: React.FC<Props> = (props) => {
  const {
    Description,
    Error,
    Label: LabelFromProps,
    className,
    filterOptions,
    label,
    path: pathFromProps,
    readOnly,
    relationTo,
    required,
    style,
    validate,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

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

  const { path, setValue, showError, value } = useField<string>({
    path: pathFromProps,
    validate: memoizedValidate,
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
        Description={Description}
        Error={Error}
        Label={Label}
        api={api}
        className={className}
        collection={collection}
        filterOptions={filterOptions}
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

export default Upload
