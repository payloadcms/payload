'use client'

import type { SlugFieldClientProps } from 'payload'

import React, { useCallback, useState } from 'react'

import { Button } from '../../elements/Button/index.js'
import { useForm } from '../../forms/Form/index.js'
import { useField } from '../../forms/useField/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { TextInput } from '../Text/index.js'
import './index.scss'

/**
 * @experimental This component is experimental and may change or be removed in the future. Use at your own risk.
 */
export const SlugField: React.FC<SlugFieldClientProps> = ({
  field,
  path,
  readOnly: readOnlyFromProps,
  useAsSlug,
}) => {
  const { label } = field

  const { t } = useTranslation()

  const { collectionSlug, globalSlug } = useDocumentInfo()

  const { slugify } = useServerFunctions()

  const { setValue, value } = useField<string>({ path: path || field.name })

  const { getData, getDataByPath } = useForm()

  const [isLocked, setIsLocked] = useState(true)

  /**
   * This method allows the user to generate their slug on demand, e.g. when they click the "generate" button.
   * It uses the `slugify` server function to gain access to their custom slugify function defined in their field config.
   */
  const handleGenerate = useCallback(
    async (e: React.MouseEvent<Element>) => {
      e.preventDefault()

      const valueToSlugify = getDataByPath(useAsSlug)

      const formattedSlug = await slugify({
        collectionSlug,
        data: getData(),
        globalSlug,
        path,
        valueToSlugify,
      })

      if (formattedSlug === null || formattedSlug === undefined) {
        setValue('')
        return
      }

      /**
       * The result may be the same as the current value, and if so, we don't want to trigger a re-render.
       */
      if (value !== formattedSlug) {
        setValue(formattedSlug)
      }
    },
    [setValue, value, useAsSlug, getData, slugify, getDataByPath, collectionSlug, globalSlug, path],
  )

  const toggleLock = useCallback((e: React.MouseEvent<Element>) => {
    e.preventDefault()
    setIsLocked((prev) => !prev)
  }, [])

  return (
    <div className="field-type slug-field-component">
      <div className="label-wrapper">
        <FieldLabel htmlFor={`field-${path}`} label={label} />
        {!readOnlyFromProps && !isLocked && (
          <Button buttonStyle="none" className="lock-button" onClick={handleGenerate}>
            {t('authentication:generate')}
          </Button>
        )}
        {!readOnlyFromProps && (
          <Button buttonStyle="none" className="lock-button" onClick={toggleLock}>
            {isLocked ? t('general:unlock') : t('general:lock')}
          </Button>
        )}
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
