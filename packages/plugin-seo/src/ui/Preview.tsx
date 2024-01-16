'use client'

import type { FormField, UIField } from 'payload/types'

import { useAllFormFields } from 'payload/components/forms'
import { useDocumentInfo, useLocale } from 'payload/components/utilities'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PluginConfig } from '../types'

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type PreviewProps = UIField & {
  pluginConfig: PluginConfig
}

export const Preview: React.FC<PreviewProps> = (props) => {
  const {
    pluginConfig: { generateURL },
  } = props || {}

  const { t } = useTranslation('plugin-seo')

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
      if (typeof generateURL === 'function' && !href) {
        const newHref = await generateURL({
          ...docInfo,
          doc: { ...fields },
          locale: typeof locale === 'object' ? locale?.code : locale,
        })

        setHref(newHref)
      }
    }

    getHref() // eslint-disable-line @typescript-eslint/no-floating-promises
  }, [generateURL, fields, href, locale, docInfo])

  return (
    <div>
      <div>{t('preview')}</div>
      <div
        style={{
          color: '#9A9A9A',
          marginBottom: '5px',
        }}
      >
        {t('previewDescription')}
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

export const getPreviewField = (props: PreviewProps) => <Preview {...props} />
