'use client'

import type { FieldType, Options } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

import {
  FieldLabel,
  TextInput,
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
import type { GenerateTitle } from '../../types.js'

import { defaults } from '../../defaults.js'
import { LengthIndicator } from '../../ui/LengthIndicator.js'
import '../index.scss'

const { maxLength: maxLengthDefault, minLength: minLengthDefault } = defaults.title

type MetaTitleProps = {
  readonly hasGenerateTitleFn: boolean
} & TextFieldClientProps

export const MetaTitleComponent: React.FC<MetaTitleProps> = (props) => {
  const {
    field: { label, maxLength: maxLengthFromProps, minLength: minLengthFromProps, required },
    hasGenerateTitleFn,
    path,
    readOnly,
  } = props || {}

  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const field: FieldType<string> = useField({ path } as Options)
  const { customComponents: { AfterInput, BeforeInput, Label } = {} } = field

  const locale = useLocale()
  const { getData } = useForm()
  const docInfo = useDocumentInfo()

  const minLength = minLengthFromProps || minLengthDefault
  const maxLength = maxLengthFromProps || maxLengthDefault

  const { errorMessage, setValue, showError, value } = field

  const regenerateTitle = useCallback(async () => {
    if (!hasGenerateTitleFn) {
      return
    }

    const endpoint = `${serverURL}${api}/plugin-seo/generate-title`

    const genTitleResponse = await fetch(endpoint, {
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
        Parameters<GenerateTitle>[0],
        'collectionConfig' | 'globalConfig' | 'hasPublishedDoc' | 'req' | 'versionCount'
      >),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const { result: generatedTitle } = await genTitleResponse.json()

    setValue(generatedTitle || '')
  }, [
    hasGenerateTitleFn,
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
          {Label ?? <FieldLabel label={label} path={path} required={required} />}
          {hasGenerateTitleFn && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                disabled={readOnly}
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
          AfterInput={AfterInput}
          BeforeInput={BeforeInput}
          Error={errorMessage}
          onChange={setValue}
          path={path}
          readOnly={readOnly}
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
