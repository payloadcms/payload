'use client'

import type { SlugFieldClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useState } from 'react'

import { Button } from '../../elements/Button/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useForm } from '../../forms/Form/index.js'
import { useField } from '../../forms/useField/index.js'
import { LockIcon } from '../../icons/Lock/index.js'
import { LockOpenIcon } from '../../icons/LockOpen/index.js'
import { RefreshIcon } from '../../icons/Refresh/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'slug-field-component'

/**
 * @experimental This component is experimental and may change or be removed in the future. Use at your own risk.
 */
export const SlugField: React.FC<SlugFieldClientProps> = ({ field, path, useAsSlug }) => {
  const { admin, label, required } = field
  const { description, placeholder, readOnly: readOnlyFromProps } = admin || {}

  const { i18n, t } = useTranslation()

  const { collectionSlug, globalSlug } = useDocumentInfo()

  const { slugify } = useServerFunctions()

  const {
    path: fieldPath,
    setValue,
    showError,
    value,
  } = useField<string>({ path: path || field.name })

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
        path: fieldPath,
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
    [
      setValue,
      value,
      useAsSlug,
      getData,
      slugify,
      getDataByPath,
      collectionSlug,
      globalSlug,
      fieldPath,
    ],
  )

  const toggleLock = useCallback((e: React.MouseEvent<Element>) => {
    e.preventDefault()
    setIsLocked((prev) => !prev)
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
    },
    [setValue],
  )

  const isReadOnly = Boolean(readOnlyFromProps || isLocked)

  return (
    <div
      className={[
        'field-type',
        baseClass,
        showError && `${baseClass}--error`,
        isLocked && `${baseClass}--locked`,
        readOnlyFromProps && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FieldLabel htmlFor={`field-${fieldPath}`} label={label} required={required} />
      <div className={`${baseClass}__wrap`}>
        <FieldError path={fieldPath} showError={showError} />

        <div
          className={[
            'form-input-group',
            `${baseClass}__input-container`,
            showError && 'form-input-group-error',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            aria-label={getTranslation(label, i18n) || path}
            className={`form-input ${baseClass}__input`}
            disabled={isReadOnly}
            id={`field-${fieldPath?.replace(/\./g, '__')}`}
            name={fieldPath}
            onChange={handleChange}
            placeholder={getTranslation(placeholder, i18n)}
            type="text"
            value={value || ''}
          />

          {!readOnlyFromProps && (
            <div className={`${baseClass}__actions`}>
              {!isLocked && (
                <Button
                  aria-label={t('authentication:generate')}
                  buttonStyle="icon-subtle"
                  className={`${baseClass}__action-btn`}
                  icon={<RefreshIcon />}
                  iconStyle="none"
                  id={`field-${fieldPath?.replace(/\./g, '__')}-generate`}
                  margin={false}
                  onClick={handleGenerate}
                />
              )}
              <Button
                aria-label={isLocked ? t('general:unlock') : t('general:lock')}
                buttonStyle="icon-subtle"
                className={`${baseClass}__action-btn`}
                icon={isLocked ? <LockIcon size={16} /> : <LockOpenIcon size={16} />}
                iconStyle="none"
                id={`field-${fieldPath?.replace(/\./g, '__')}-lock`}
                margin={false}
                onClick={toggleLock}
              />
            </div>
          )}
        </div>

        <FieldDescription description={description} path={fieldPath} />
      </div>
    </div>
  )
}
