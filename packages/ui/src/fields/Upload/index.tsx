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
      admin: { allowCreate, className, isSortable, readOnly: readOnlyFromAdmin, style, width } = {},
      hasMany,
      label,
      localized,
      maxRows,
      relationTo,
      required,
    },
    Label,
    path,
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props

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
    readOnly: readOnlyFromField,
    setValue,
    showError,
    value,
  } = useField<string | string[]>({
    path,
    validate: memoizedValidate,
  })

  const disabled =
    readOnlyFromTopLevelProps ||
    readOnlyFromAdmin ||
    readOnlyFromField ||
    formProcessing ||
    formInitializing ||
    allowCreate === false

  return (
    <UploadInput
      api={config.routes.api}
      className={className}
      Description={Description}
      Error={Error}
      filterOptions={filterOptions}
      hasMany={hasMany}
      isSortable={isSortable}
      label={label}
      Label={Label}
      localized={localized}
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
