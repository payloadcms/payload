'use client'
import type { TextFieldClientProps } from 'payload'

import { Button, FieldLabel, TextInput, useField, useForm, useFormFields } from '@payloadcms/ui'
import React, { useCallback } from 'react'

import { formatSlug } from './formatSlug.js'
// import './index.scss'

type SlugComponentProps = {
  checkboxFieldPath: string
  fieldToUse: string
} & TextFieldClientProps

export const SlugComponent: React.FC<SlugComponentProps> = ({
  checkboxFieldPath: checkboxFieldPathFromProps,
  field,
  fieldToUse,
  path,
  readOnly: readOnlyFromProps,
}) => {
  const { label } = field

  const checkboxFieldPath = path?.includes('.')
    ? `${path}.${checkboxFieldPathFromProps}`
    : checkboxFieldPathFromProps

  const { setValue, value } = useField<string>({ path: path || field.name })

  const { dispatchFields, getDataByPath } = useForm()

  // The value of the checkbox
  // We're using separate useFormFields to minimise re-renders
  const isLocked = useFormFields(([fields]) => {
    return fields[checkboxFieldPath]?.value as string
  })

  const handleGenerate = useCallback(
    (e: React.MouseEvent<Element>) => {
      e.preventDefault()

      const targetFieldValue = getDataByPath(fieldToUse)

      if (targetFieldValue) {
        const formattedSlug = formatSlug(targetFieldValue)

        if (value !== formattedSlug) {
          setValue(formattedSlug)
        }
      } else {
        if (value !== '') {
          setValue('')
        }
      }
    },
    [setValue, value, fieldToUse, getDataByPath],
  )

  const handleLock = useCallback(
    (e: React.MouseEvent<Element>) => {
      e.preventDefault()

      dispatchFields({
        type: 'UPDATE',
        path: checkboxFieldPath,
        value: !isLocked,
      })
    },
    [isLocked, checkboxFieldPath, dispatchFields],
  )

  return (
    <div className="field-type slug-field-component">
      <div className="label-wrapper">
        <FieldLabel htmlFor={`field-${path}`} label={label} />
        {!isLocked && (
          <Button buttonStyle="none" className="lock-button" onClick={handleGenerate}>
            Generate
          </Button>
        )}
        <Button buttonStyle="none" className="lock-button" onClick={handleLock}>
          {isLocked ? 'Unlock' : 'Lock'}
        </Button>
      </div>
      <TextInput
        onChange={setValue}
        path={path || field.name}
        readOnly={Boolean(readOnlyFromProps || isLocked)}
        value={value}
      />
    </div>
  )
}
