'use client'

import type { UploadFieldClientProps } from 'payload'

import React from 'react'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import './index.scss'
import { UploadInput } from './Input.js'

export { UploadInput } from './Input.js'
export type { UploadInputProps } from './Input.js'

export const baseClass = 'upload'

export function UploadComponent(props: UploadFieldClientProps) {
  const {
    Description,
    Error,
    field: {
      _path,
      admin: { className, isSortable, readOnly: readOnlyFromAdmin, style, width } = {},
      hasMany,
      maxRows,
      relationTo,
      required,
    },
    Label,
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props
  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const { config } = useConfig()

  const memoizedValidate = React.useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )
  const {
    filterOptions,
    formInitializing,
    formProcessing,
    path,
    readOnly: readOnlyFromField,
    setValue,
    showError,
    value,
  } = useField<string | string[]>({
    path: _path,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromField || formProcessing || formInitializing

  return (
    <UploadInput
      api={config.routes.api}
      className={className}
      Description={Description}
      Error={Error}
      filterOptions={filterOptions}
      hasMany={hasMany}
      isSortable={isSortable}
      Label={Label}
      maxRows={maxRows}
      onChange={setValue}
      path={path}
      readOnly={disabled}
      relationTo={relationTo}
      required={required}
      serverURL={config.serverURL}
      showError={showError}
      style={style}
      value={value}
      width={width}
    />
  )
}

export const UploadField = withCondition(UploadComponent)
