'use client'

import type { UploadFieldClientProps, ValueWithRelation } from 'payload'

import React, { useMemo } from 'react'

import { BulkUploadProvider } from '../../elements/BulkUpload/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import { UploadInput } from './Input.js'
import './index.scss'

export { UploadInput } from './Input.js'
export type { UploadInputProps } from './Input.js'

export const baseClass = 'upload'

export function UploadComponent(props: UploadFieldClientProps) {
  const {
    field,
    field: {
      admin: { allowCreate, className, description, isSortable } = {},
      hasMany,
      label,
      localized,
      maxRows,
      relationTo: relationToFromProps,
      required,
    },
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const { config } = useConfig()

  const displayPreview = field.displayPreview

  const memoizedValidate = React.useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    filterOptions,
    path,
    setValue,
    showError,
    value,
  } = useField<string | string[]>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const isPolymorphic = Array.isArray(relationToFromProps)

  const memoizedValue:
    | (number | string)[]
    | number
    | string
    | ValueWithRelation
    | ValueWithRelation[] = React.useMemo(() => {
    if (hasMany === true) {
      return (
        Array.isArray(value)
          ? value.map((val) => {
              return isPolymorphic
                ? val
                : {
                    relationTo: Array.isArray(relationToFromProps)
                      ? relationToFromProps[0]
                      : relationToFromProps,
                    value: val,
                  }
            })
          : value
      ) as ValueWithRelation[]
    } else {
      // Value comes in as string when not polymorphic and with the object with the right relationTo when it is polymorphic
      return value
    }
  }, [hasMany, value, isPolymorphic, relationToFromProps])

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <BulkUploadProvider drawerSlugPrefix={pathFromProps}>
      <UploadInput
        AfterInput={AfterInput}
        allowCreate={allowCreate !== false}
        api={config.routes.api}
        BeforeInput={BeforeInput}
        className={className}
        Description={Description}
        description={description}
        displayPreview={displayPreview}
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
        readOnly={readOnly || disabled}
        relationTo={relationToFromProps}
        required={required}
        serverURL={config.serverURL}
        showError={showError}
        style={styles}
        value={memoizedValue}
      />
    </BulkUploadProvider>
  )
}

export const UploadField = withCondition(UploadComponent)
