'use client'

import type { FieldType, Options } from '@payloadcms/ui'
import type { UploadFieldClientProps } from 'payload'

import {
  FieldLabel,
  RenderCustomComponent,
  UploadInput,
  useConfig,
  useDocumentInfo,
  useField,
  useForm,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { reduceToSerializableFields } from '@payloadcms/ui/shared'
import React, { useCallback } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../../translations/index.js'
import type { GenerateImage } from '../../types.js'

import { Pill } from '../../ui/Pill.js'

type MetaImageProps = {
  readonly hasGenerateImageFn: boolean
} & UploadFieldClientProps

export const MetaImageComponent: React.FC<MetaImageProps> = (props) => {
  const {
    field: { label, localized, relationTo, required },
    hasGenerateImageFn,
    path,
    readOnly,
  } = props || {}

  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const field: FieldType<string> = useField({ ...props, path } as Options)
  const {
    customComponents: { Error, Label },
  } = field

  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const locale = useLocale()
  const { getData } = useForm()
  const docInfo = useDocumentInfo()

  const { setValue, showError, value } = field

  const regenerateImage = useCallback(async () => {
    if (!hasGenerateImageFn) {
      return
    }

    const endpoint = `${serverURL}${api}/plugin-seo/generate-image`

    const genImageResponse = await fetch(endpoint, {
      body: JSON.stringify({
        id: docInfo.id,
        collectionSlug: docInfo.collectionSlug,
        doc: getData(),
        docPermissions: docInfo.docPermissions,
        globalSlug: docInfo.globalSlug,
        hasPublishPermission: docInfo.hasPublishPermission,
        hasSavePermission: docInfo.hasSavePermission,
        initialData: docInfo.initialData,
        initialState: reduceToSerializableFields(docInfo.initialState),
        locale: typeof locale === 'object' ? locale?.code : locale,
        title: docInfo.title,
      } satisfies Omit<
        Parameters<GenerateImage>[0],
        'collectionConfig' | 'globalConfig' | 'hasPublishedDoc' | 'req' | 'versionCount'
      >),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const generatedImage = await genImageResponse.text()

    setValue(generatedImage || '')
  }, [
    hasGenerateImageFn,
    serverURL,
    api,
    docInfo.id,
    docInfo.collectionSlug,
    docInfo.docPermissions,
    docInfo.globalSlug,
    docInfo.hasPublishPermission,
    docInfo.hasSavePermission,
    docInfo.initialData,
    docInfo.initialState,
    docInfo.title,
    getData,
    locale,
    setValue,
  ])

  const hasImage = Boolean(value)

  const collection = getEntityConfig({ collectionSlug: relationTo })

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
          <RenderCustomComponent
            CustomComponent={Label}
            Fallback={
              <FieldLabel label={label} localized={localized} path={path} required={required} />
            }
          />
          {hasGenerateImageFn && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                disabled={readOnly}
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
          api={api}
          collection={collection}
          Error={Error}
          filterOptions={field.filterOptions}
          onChange={(incomingImage) => {
            if (incomingImage !== null) {
              if (typeof incomingImage === 'object') {
                const { id: incomingID } = incomingImage
                setValue(incomingID)
              } else {
                setValue(incomingImage)
              }
            } else {
              setValue(null)
            }
          }}
          path={path}
          readOnly={readOnly}
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
