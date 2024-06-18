'use client'

import type { FormField, UIField } from 'payload'

import { useAllFormFields } from '@payloadcms/ui/forms/Form'
import { useDocumentInfo } from '@payloadcms/ui/providers/DocumentInfo'
import { useLocale } from '@payloadcms/ui/providers/Locale'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React, { useEffect, useState } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../translations/index.js'
import type { GenerateURL } from '../types.js'

type PreviewProps = UIField & {
  hasGenerateURLFn: boolean
}

export const Preview: React.FC<PreviewProps> = ({ hasGenerateURLFn }) => {
  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const locale = useLocale()
  const [fields] = useAllFormFields()
  const docInfo = useDocumentInfo()

  const {
    'meta.description': { value: metaDescription } = {} as FormField,
    'meta.title': { value: metaTitle } = {} as FormField,
  } = fields

  const [href, setHref] = useState<string>()

  useEffect(() => {
    const getHref = async () => {
      const genURLResponse = await fetch('/api/plugin-seo/generate-url', {
        body: JSON.stringify({
          ...docInfo,
          doc: { ...fields },
          locale: typeof locale === 'object' ? locale?.code : locale,
        } satisfies Parameters<GenerateURL>[0]),
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
  }, [fields, href, locale, docInfo, hasGenerateURLFn])

  return (
    <div>
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
