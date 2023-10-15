'use client'

import React, { useEffect, useState } from 'react'
import { useAllFormFields } from 'payload/components/forms'
import { useDocumentInfo, useLocale } from 'payload/components/utilities'
import { Field } from 'payload/dist/admin/components/forms/Form/types'

import { PluginConfig } from '../types'

type PreviewFieldWithProps = Field & {
  pluginConfig: PluginConfig
}

export const Preview: React.FC<PreviewFieldWithProps | {}> = props => {
  const {
    pluginConfig: { generateURL },
  } = (props as PreviewFieldWithProps) || {} // TODO: this typing is temporary until payload types are updated for custom field props;

  const locale = useLocale()
  const [fields] = useAllFormFields()
  const docInfo = useDocumentInfo()

  const {
    'meta.title': { value: metaTitle } = {} as Field,
    'meta.description': { value: metaDescription } = {} as Field,
  } = fields

  const [href, setHref] = useState<string>()

  useEffect(() => {
    const getHref = async () => {
      if (typeof generateURL === 'function' && !href) {
        const newHref = await generateURL({
          ...docInfo,
          doc: { fields },
          locale,
        })

        setHref(newHref)
      }
    }
    getHref()
  }, [generateURL, fields, href, locale, docInfo])

  return (
    <div>
      <div>Preview</div>
      <div
        style={{
          marginBottom: '5px',
          color: '#9A9A9A',
        }}
      >
        Exact result listings may vary based on content and search relevancy.
      </div>
      <div
        style={{
          padding: '20px',
          borderRadius: '5px',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
          pointerEvents: 'none',
          maxWidth: '600px',
          width: '100%',
          background: 'var(--theme-elevation-50)',
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

export const getPreviewField = (props: any) => <Preview {...props} />
