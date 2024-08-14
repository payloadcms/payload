'use client'

import type { FieldType, Options, UploadFieldProps } from '@payloadcms/ui'

import {
  FieldLabel,
  UploadInput,
  useConfig,
  useDocumentInfo,
  useField,
  useFieldProps,
  useForm,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../../translations/index.js'
import type { GenerateImage } from '../../types.js'

import { Pill } from '../../ui/Pill.js'

type MetaImageProps = {
  hasGenerateImageFn: boolean
} & UploadFieldProps

export const MetaImageComponent: React.FC<MetaImageProps> = (props) => {
  const {
    field: {
      admin: {
        components: { Label },
      },
      label,
      relationTo,
      required,
    },
    hasGenerateImageFn,
    labelProps,
  } = props || {}
  const { path: pathFromContext } = useFieldProps()

  const field: FieldType<string> = useField({ ...props, path: pathFromContext } as Options)

  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const locale = useLocale()
  const { getData } = useForm()
  const docInfo = useDocumentInfo()

  const { errorMessage, setValue, showError, value } = field

  const regenerateImage = useCallback(async () => {
    if (!hasGenerateImageFn) return

    const genImageResponse = await fetch('/api/plugin-seo/generate-image', {
      body: JSON.stringify({
        ...docInfo,
        doc: { ...getData() },
        locale: typeof locale === 'object' ? locale?.code : locale,
      } satisfies Parameters<GenerateImage>[0]),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const generatedImage = await genImageResponse.text()

    setValue(generatedImage || '')
  }, [hasGenerateImageFn, docInfo, getData, locale, setValue])

  const hasImage = Boolean(value)

  const { config } = useConfig()

  const { collections, routes: { api } = {}, serverURL } = config

  const collection = collections?.find((coll) => coll.slug === relationTo) || undefined

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
          {hasGenerateImageFn && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                onClick={() => {
                  void regenerateImage()
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
        {hasGenerateImageFn && (
          <div
            style={{
              color: '#9A9A9A',
            }}
          >
            {t('plugin-seo:imageAutoGenerationTip')}
          </div>
        )}
      </div>
      <div
        style={{
          marginBottom: '10px',
          position: 'relative',
        }}
      >
        <UploadInput
          Error={{
            type: 'client',
            Component: null,
            RenderedComponent: errorMessage,
          }}
          api={api}
          collection={collection}
          filterOptions={field.filterOptions}
          label={undefined}
          onChange={(incomingImage) => {
            if (incomingImage !== null) {
              const { id: incomingID } = incomingImage
              setValue(incomingID)
            } else {
              setValue(null)
            }
          }}
          relationTo={relationTo}
          required={required}
          serverURL={serverURL}
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
        <Pill
          backgroundColor={hasImage ? 'green' : 'red'}
          color="white"
          label={hasImage ? t('plugin-seo:good') : t('plugin-seo:noImage')}
        />
      </div>
    </div>
  )
}
