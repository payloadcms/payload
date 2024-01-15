'use client'

import type { Props as UploadInputProps } from 'payload/components/fields/Upload'
import type { FieldType, Options } from 'payload/dist/admin/components/forms/useField/types'

import { UploadInput, useAllFormFields, useField } from 'payload/components/forms'
import { useConfig, useDocumentInfo, useLocale } from 'payload/components/utilities'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { PluginConfig } from '../types'

import { Pill } from '../ui/Pill'

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type MetaImageProps = UploadInputProps & {
  path: string
  pluginConfig: PluginConfig
}

export const MetaImage: React.FC<MetaImageProps> = (props) => {
  const { name, fieldTypes, label, pluginConfig, relationTo, required } = props || {}

  const field: FieldType<string> = useField(props as Options)

  const { t } = useTranslation('plugin-seo')

  const locale = useLocale()
  const [fields] = useAllFormFields()
  const docInfo = useDocumentInfo()

  const { setValue, showError, value, errorMessage } = field

  const regenerateImage = useCallback(async () => {
    const { generateImage } = pluginConfig
    let generatedImage

    if (typeof generateImage === 'function') {
      generatedImage = await generateImage({
        ...docInfo,
        doc: { ...fields },
        locale: typeof locale === 'object' ? locale?.code : locale,
      })
    }

    setValue(generatedImage)
  }, [fields, setValue, pluginConfig, locale, docInfo])

  const hasImage = Boolean(value)

  const config = useConfig()

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

          {typeof pluginConfig.generateImage === 'function' && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                onClick={regenerateImage}
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
        {typeof pluginConfig.generateImage === 'function' && (
          <div
            style={{
              color: '#9A9A9A',
            }}
          >
            {t('imageAutoGenerationTip')}
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
          api={api}
          collection={collection}
          fieldTypes={fieldTypes}
          filterOptions={{}}
          errorMessage={errorMessage}
          required={required}
          label={undefined}
          name={name}
          onChange={(incomingImage) => {
            if (incomingImage !== null) {
              const { id: incomingID } = incomingImage
              setValue(incomingID)
            } else {
              setValue(null)
            }
          }}
          path={name}
          relationTo={relationTo}
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
          label={hasImage ? t('good') : t('noImage')}
        />
      </div>
    </div>
  )
}

export const getMetaImageField = (props: MetaImageProps) => <MetaImage {...props} />
