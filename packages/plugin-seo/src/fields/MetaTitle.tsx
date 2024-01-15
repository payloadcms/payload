'use client'

import type {
  FieldType as FieldType,
  Options,
} from 'payload/dist/admin/components/forms/useField/types'
import type { TextField as TextFieldType } from 'payload/types'

import { TextInput, useAllFormFields, useField } from 'payload/components/forms'
import { useDocumentInfo, useLocale } from 'payload/components/utilities'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { PluginConfig } from '../types'

import { defaults } from '../defaults'
import { LengthIndicator } from '../ui/LengthIndicator'

const { maxLength, minLength } = defaults.title

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type MetaTitleProps = TextFieldType & {
  path: string
  pluginConfig: PluginConfig
}

export const MetaTitle: React.FC<MetaTitleProps> = (props) => {
  const { name, label, path, pluginConfig, required } = props || {}

  const { t } = useTranslation('plugin-seo')

  const field: FieldType<string> = useField({
    name,
    label,
    path,
  } as Options)

  const locale = useLocale()
  const [fields] = useAllFormFields()
  const docInfo = useDocumentInfo()

  const { setValue, showError, value, errorMessage } = field

  const regenerateTitle = useCallback(async () => {
    const { generateTitle } = pluginConfig
    let generatedTitle

    if (typeof generateTitle === 'function') {
      generatedTitle = await generateTitle({
        ...docInfo,
        doc: { ...fields },
        locale: typeof locale === 'object' ? locale?.code : locale,
      })
    }

    setValue(generatedTitle)
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

          {typeof pluginConfig.generateTitle === 'function' && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                onClick={regenerateTitle}
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
          {t('lengthTipTitle', { maxLength, minLength })}
          <a
            href="https://developers.google.com/search/docs/advanced/appearance/title-link#page-titles"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('bestPractices')}
          </a>
          .
        </div>
      </div>
      <div
        style={{
          marginBottom: '10px',
          position: 'relative',
        }}
      >
        <TextInput
          name={name}
          onChange={setValue}
          path={name}
          showError={showError}
          style={{
            marginBottom: 0,
          }}
          errorMessage={errorMessage}
          required={required}
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

export const getMetaTitleField = (props: MetaTitleProps) => <MetaTitle {...props} />
