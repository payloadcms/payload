'use client'

import type { FormField, UIField } from 'payload'

import {
  useAllFormFields,
  useConfig,
  useDocumentInfo,
  useForm,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { reduceToSerializableFields } from '@payloadcms/ui/shared'
import React, { useEffect, useState } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../../translations/index.js'
import type { GenerateURL } from '../../types.js'

type PreviewProps = {
  readonly descriptionPath?: string
  readonly hasGenerateURLFn: boolean
  readonly titlePath?: string
} & UIField

export const PreviewComponent: React.FC<PreviewProps> = (props) => {
  const {
    descriptionPath: descriptionPathFromContext,
    hasGenerateURLFn,
    titlePath: titlePathFromContext,
  } = props

  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const locale = useLocale()
  const [fields] = useAllFormFields()
  const { getData } = useForm()
  const docInfo = useDocumentInfo()

  const descriptionPath = descriptionPathFromContext || 'meta.description'
  const titlePath = titlePathFromContext || 'meta.title'

  const {
    [descriptionPath]: { value: metaDescription } = {} as FormField,
    [titlePath]: { value: metaTitle } = {} as FormField,
  } = fields

  const [href, setHref] = useState<string>()

  useEffect(() => {
    const endpoint = `${serverURL}${api}/plugin-seo/generate-url`

    const getHref = async () => {
      const genURLResponse = await fetch(endpoint, {
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
          Parameters<GenerateURL>[0],
          'collectionConfig' | 'globalConfig' | 'hasPublishedDoc' | 'req' | 'versionCount'
        >),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const { result: newHref } = await genURLResponse.json()

      setHref(newHref)
    }

    if (hasGenerateURLFn && !href) {
      void getHref()
    }
  }, [fields, href, locale, docInfo, hasGenerateURLFn, getData, serverURL, api])

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div>{t('plugin-seo:preview')}</div>
      <div
        style={{
          color: '#9A9A9A',
          marginBottom: '5px',
        }}
      >
        {t('plugin-seo:previewDescription')}
      </div>
      <div
        style={{
          background: 'var(--theme-elevation-50)',
          borderRadius: '5px',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          padding: '20px',
          pointerEvents: 'none',
          width: '100%',
        }}
      >
        <div>
          <a
            href={href}
            style={{
              textDecoration: 'none',
            }}
          >
            {href || 'https://...'}
          </a>
        </div>
        <h4
          style={{
            margin: 0,
          }}
        >
          <a
            href="/"
            style={{
              textDecoration: 'none',
            }}
          >
            {metaTitle as string}
          </a>
        </h4>
        <p
          style={{
            margin: 0,
          }}
        >
          {metaDescription as string}
        </p>
      </div>
    </div>
  )
}
