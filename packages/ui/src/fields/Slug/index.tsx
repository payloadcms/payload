'use client'
import type { SlugFieldProps } from 'payload'

import { slugify } from 'payload/shared'
import React, { useCallback, useState } from 'react'

import { Button } from '../../elements/Button/index.js'
import { useForm } from '../../forms/Form/index.js'
import { useField } from '../../forms/useField/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { TextInput } from '../Text/index.js'
import './index.scss'

/**
 * @experimental This component is experimental and may change or be removed in the future. Use at your own risk.
 */
export const SlugField: React.FC<SlugFieldProps> = ({
  field,
  fieldToUse,
  path,
  readOnly: readOnlyFromProps,
}) => {
  const { label } = field

  const { setValue, value } = useField<string>({ path: path || field.name })

  const { getDataByPath } = useForm()

  const [isLocked, setIsLocked] = useState(true)

  const handleGenerate = useCallback(
    (e: React.MouseEvent<Element>) => {
      e.preventDefault()

      const targetFieldValue = getDataByPath(fieldToUse)

      if (targetFieldValue) {
        const formattedSlug = slugify(targetFieldValue as string)

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

  const toggleLock = useCallback((e: React.MouseEvent<Element>) => {
    e.preventDefault()
    setIsLocked((prev) => !prev)
  }, [])

  return (
    <div className="field-type slug-field-component">
      <div className="label-wrapper">
        <FieldLabel htmlFor={`field-${path}`} label={label} />
        {!isLocked && (
          <Button buttonStyle="none" className="lock-button" onClick={handleGenerate}>
            Generate
          </Button>
        )}
        <Button buttonStyle="none" className="lock-button" onClick={toggleLock}>
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
