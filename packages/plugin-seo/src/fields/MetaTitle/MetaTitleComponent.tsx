'use client'

import type { FieldType, Options } from '@payloadcms/ui'
import type { TextFieldProps } from 'payload'

import {
  FieldLabel,
  TextInput,
  useDocumentInfo,
  useField,
  useFieldProps,
  useForm,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../../translations/index.js'
import type { GenerateTitle } from '../../types.js'

import { defaults } from '../../defaults.js'
import { LengthIndicator } from '../../ui/LengthIndicator.js'
import '../index.scss'

const { maxLength, minLength } = defaults.title

type MetaTitleProps = {
  hasGenerateTitleFn: boolean
} & TextFieldProps

export const MetaTitleComponent: React.FC<MetaTitleProps> = (props) => {
  const {
    field: {
      admin: {
        components: { Label },
      },
      label,
      required,
    },
    hasGenerateTitleFn,
    labelProps,
  } = props || {}
  const { path: pathFromContext } = useFieldProps()

  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const field: FieldType<string> = useField({
    path: pathFromContext,
  } as Options)

  const locale = useLocale()
  const { getData } = useForm()
  const docInfo = useDocumentInfo()

  const { errorMessage, setValue, showError, value } = field

  const regenerateTitle = useCallback(async () => {
    if (!hasGenerateTitleFn) return

    const genTitleResponse = await fetch('/api/plugin-seo/generate-title', {
      body: JSON.stringify({
        ...docInfo,
        doc: { ...getData() },
        locale: typeof locale === 'object' ? locale?.code : locale,
      } satisfies Parameters<GenerateTitle>[0]),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const { result: generatedTitle } = await genTitleResponse.json()

    setValue(generatedTitle || '')
  }, [hasGenerateTitleFn, docInfo, getData, locale, setValue])

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
        <div className="plugin-seo__field">
          <FieldLabel Label={Label} label={label} {...(labelProps || {})} />
          {hasGenerateTitleFn && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                onClick={() => {
                  void regenerateTitle()
                }}
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
                {t('plugin-seo:autoGenerate')}
              </button>
            </React.Fragment>
          )}
        </div>
        <div
          style={{
            color: '#9A9A9A',
          }}
        >
          {t('plugin-seo:lengthTipTitle', { maxLength, minLength })}
          <a
            href="https://developers.google.com/search/docs/advanced/appearance/title-link#page-titles"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('plugin-seo:bestPractices')}
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
          Error={{
            type: 'client',
            Component: null,
            RenderedComponent: errorMessage,
          }}
          label={label}
          onChange={setValue}
          path={pathFromContext}
          required={required}
          showError={showError}
          style={{
            marginBottom: 0,
          }}
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
