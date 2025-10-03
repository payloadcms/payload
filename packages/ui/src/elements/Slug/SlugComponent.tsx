'use client'
import type { TextFieldClientProps } from 'payload'

import { toKebabCase } from 'payload/shared'
import React, { useCallback, useState } from 'react'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { TextInput } from '../../fields/Text/index.js'
import { useForm } from '../../forms/Form/index.js'
import { useField } from '../../forms/useField/index.js'
import { Button } from '../Button/index.js'
import './index.scss'

type SlugComponentProps = {
  fieldToUse: string
} & TextFieldClientProps

export const SlugComponent: React.FC<SlugComponentProps> = ({
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
        const formattedSlug = toKebabCase(targetFieldValue as string)

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
