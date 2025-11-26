'use client'

import type { SlugFieldClientProps } from 'payload'

import React, { useCallback, useState } from 'react'

import { Button } from '../../elements/Button/index.js'
import { useForm } from '../../forms/Form/index.js'
import { useField } from '../../forms/useField/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import './index.scss'
import { TextInput } from '../Text/index.js'

/**
 * @experimental This component is experimental and may change or be removed in the future. Use at your own risk.
 */
export const SlugField: React.FC<SlugFieldClientProps> = ({
  field,
  fieldToUse,
  path,
  readOnly: readOnlyFromProps,
}) => {
  const { label } = field

  const { slugify } = useServerFunctions()

  const { collectionSlug, globalSlug } = useDocumentInfo()

  const { setValue, value } = useField<string>({ path: path || field.name })

  const { getDataByPath } = useForm()

  const [isLocked, setIsLocked] = useState(true)

  const handleGenerate = useCallback(
    async (e: React.MouseEvent<Element>) => {
      e.preventDefault()

      const targetFieldValue = getDataByPath(fieldToUse)

      if (targetFieldValue) {
        const formattedSlug = await slugify({
          collectionSlug,
          globalSlug,
          path,
          val: targetFieldValue as string,
        })

        if (value !== formattedSlug) {
          setValue(formattedSlug)
        }
      } else {
        if (value !== '') {
          setValue('')
        }
      }
    },
    [setValue, value, fieldToUse, getDataByPath, slugify, path, collectionSlug, globalSlug],
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
          <Button
            buttonStyle="none"
            className="generate-button"
            id={`field-${path}-generate`}
            onClick={handleGenerate}
          >
            Generate
          </Button>
        )}
        <Button
          buttonStyle="none"
          className="lock-button"
          id={`field-${path}-lock`}
          onClick={toggleLock}
        >
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
