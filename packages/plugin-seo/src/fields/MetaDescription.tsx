'use client'

import type { FieldType, Options } from 'payload/dist/admin/components/forms/useField/types'
import type { TextareaField } from 'payload/types'

import { TextareaInput, useAllFormFields, useField } from 'payload/components/forms'
import { useDocumentInfo, useLocale } from 'payload/components/utilities'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { PluginConfig } from '../types'

import { defaults } from '../defaults'
import { LengthIndicator } from '../ui/LengthIndicator'

const { maxLength, minLength } = defaults.description

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type MetaDescriptionProps = TextareaField & {
  path: string
  pluginConfig: PluginConfig
}

export const MetaDescription: React.FC<MetaDescriptionProps> = (props) => {
  const { name, label, path, pluginConfig, required } = props

  const { t } = useTranslation('plugin-seo')

  const locale = useLocale()
  const [fields] = useAllFormFields()
  const docInfo = useDocumentInfo()

  const field: FieldType<string> = useField({
    name,
    label,
    path,
  } as Options)

  const { setValue, showError, value, errorMessage } = field

  const regenerateDescription = useCallback(async () => {
    const { generateDescription } = pluginConfig
    let generatedDescription

    if (typeof generateDescription === 'function') {
      generatedDescription = await generateDescription({
        ...docInfo,
        doc: { ...fields },
        locale: typeof locale === 'object' ? locale?.code : locale,
      })
    }

    setValue(generatedDescription)
  }, [fields, setValue, pluginConfig, locale, docInfo])

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          marginBottom: '5px',
          position: 'relative',
        }}
      >
        <div>
          {label && typeof label === 'string' && label}

          {required && (
            <span
              style={{
                marginLeft: '5px',
                color: 'var(--theme-error-500)',
              }}
            >
              *
            </span>
          )}

          {typeof pluginConfig.generateDescription === 'function' && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                onClick={regenerateDescription}
                style={{
                  background: 'none',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'currentcolor',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
                type="button"
              >
                {t('autoGenerate')}
              </button>
            </React.Fragment>
          )}
        </div>
        <div
          style={{
            color: '#9A9A9A',
          }}
        >
          {t('lengthTipDescription', { maxLength, minLength })}
          <a
            href="https://developers.google.com/search/docs/advanced/appearance/snippet#meta-descriptions"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('bestPractices')}
          </a>
        </div>
      </div>
      <div
        style={{
          marginBottom: '10px',
          position: 'relative',
        }}
      >
        <TextareaInput
          name={name}
          onChange={setValue}
          path={name}
          showError={showError}
          style={{
            marginBottom: 0,
          }}
          required={required}
          errorMessage={errorMessage}
          value={value}
        />
      </div>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          width: '100%',
        }}
      >
        <LengthIndicator maxLength={maxLength} minLength={minLength} text={value} />
      </div>
    </div>
  )
}

export const getMetaDescriptionField = (props: MetaDescriptionProps) => (
  <MetaDescription {...props} />
)
