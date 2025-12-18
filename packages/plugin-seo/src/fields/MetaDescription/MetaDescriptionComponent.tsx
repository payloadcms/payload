'use client'

import type { FieldType } from '@payloadcms/ui'
import type { TextareaFieldClientProps } from 'payload'

import {
  FieldLabel,
  TextareaInput,
  useConfig,
  useDocumentInfo,
  useDocumentTitle,
  useField,
  useForm,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { reduceToSerializableFields } from '@payloadcms/ui/shared'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../../translations/index.js'
import type { GenerateDescription } from '../../types.js'

import { defaults } from '../../defaults.js'
import { LengthIndicator } from '../../ui/LengthIndicator.js'

const { maxLength: maxLengthDefault, minLength: minLengthDefault } = defaults.description

type MetaDescriptionProps = {
  readonly hasGenerateDescriptionFn: boolean
} & TextareaFieldClientProps

export const MetaDescriptionComponent: React.FC<MetaDescriptionProps> = (props) => {
  const {
    field: {
      label,
      localized,
      maxLength: maxLengthFromProps,
      minLength: minLengthFromProps,
      required,
    },
    hasGenerateDescriptionFn,
    readOnly,
  } = props

  const {
    config: {
      routes: { api },
    },
  } = useConfig()

  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const locale = useLocale()
  const { getData } = useForm()
  const docInfo = useDocumentInfo()
  const { title } = useDocumentTitle()

  const maxLength = maxLengthFromProps || maxLengthDefault
  const minLength = minLengthFromProps || minLengthDefault

  const {
    customComponents: { AfterInput, BeforeInput, Label } = {},
    errorMessage,
    path,
    setValue,
    showError,
    value,
  }: FieldType<string> = useField()

  const regenerateDescription = useCallback(async () => {
    if (!hasGenerateDescriptionFn) {
      return
    }

    const endpoint = formatAdminURL({
      apiRoute: api,
      path: '/plugin-seo/generate-description',
    })

    const genDescriptionResponse = await fetch(endpoint, {
      body: JSON.stringify({
        id: docInfo.id,
        collectionSlug: docInfo.collectionSlug,
        doc: getData(),
        docPermissions: docInfo.docPermissions,
        globalSlug: docInfo.globalSlug,
        hasPublishPermission: docInfo.hasPublishPermission,
        hasSavePermission: docInfo.hasSavePermission,
        initialData: docInfo.initialData,
        initialState: reduceToSerializableFields(docInfo.initialState ?? {}),
        locale: typeof locale === 'object' ? locale?.code : locale,
        title,
      } satisfies Omit<
        Parameters<GenerateDescription>[0],
        'collectionConfig' | 'globalConfig' | 'hasPublishedDoc' | 'req' | 'versionCount'
      >),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const { result: generatedDescription } = await genDescriptionResponse.json()

    setValue(generatedDescription || '')
  }, [
    hasGenerateDescriptionFn,

    api,
    docInfo.id,
    docInfo.collectionSlug,
    docInfo.docPermissions,
    docInfo.globalSlug,
    docInfo.hasPublishPermission,
    docInfo.hasSavePermission,
    docInfo.initialData,
    docInfo.initialState,
    getData,
    locale,
    setValue,
    title,
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
          {Label ?? (
            <FieldLabel label={label} localized={localized} path={path} required={required} />
          )}
          {hasGenerateDescriptionFn && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                disabled={readOnly}
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
