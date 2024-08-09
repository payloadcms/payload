'use client'

import type { FieldType, Options } from '@payloadcms/ui'
import type { TextareaFieldProps } from 'payload'

import {
  FieldLabel,
  TextareaInput,
  useDocumentInfo,
  useField,
  useFieldProps,
  useForm,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../../translations/index.js'
import type { GenerateDescription } from '../../types.js'

import { defaults } from '../../defaults.js'
import { LengthIndicator } from '../../ui/LengthIndicator.js'

const { maxLength, minLength } = defaults.description

type MetaDescriptionProps = {
  hasGenerateDescriptionFn: boolean
} & TextareaFieldProps

export const MetaDescriptionComponent: React.FC<MetaDescriptionProps> = (props) => {
  const {
    field: {
      admin: {
        components: { Label },
      },
      label,
      required,
    },
    hasGenerateDescriptionFn,
    labelProps,
  } = props
  const { path: pathFromContext } = useFieldProps()

  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const locale = useLocale()
  const { getData } = useForm()
  const docInfo = useDocumentInfo()

  const field: FieldType<string> = useField({
    path: pathFromContext,
  } as Options)

  const { errorMessage, setValue, showError, value } = field

  const regenerateDescription = useCallback(async () => {
    if (!hasGenerateDescriptionFn) return

    const genDescriptionResponse = await fetch('/api/plugin-seo/generate-description', {
      body: JSON.stringify({
        ...docInfo,
        doc: { ...getData() },
        locale: typeof locale === 'object' ? locale?.code : locale,
      } satisfies Parameters<GenerateDescription>[0]),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const { result: generatedDescription } = await genDescriptionResponse.json()

    setValue(generatedDescription || '')
  }, [hasGenerateDescriptionFn, docInfo, getData, locale, setValue])

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
          {hasGenerateDescriptionFn && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                onClick={() => {
                  void regenerateDescription()
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
          {t('plugin-seo:lengthTipDescription', { maxLength, minLength })}
          <a
            href="https://developers.google.com/search/docs/advanced/appearance/snippet#meta-descriptions"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('plugin-seo:bestPractices')}
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
