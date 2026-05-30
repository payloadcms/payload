'use client'

import { CopyToClipboard, Link, useConfig, useField, useTranslation } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { PluginSearchTranslationKeys, PluginSearchTranslations } from '../../../translations/index.js'

export const LinkToDocClient: React.FC<{ label?: React.JSX.Element | string }> = ({ label }) => {
  const { config } = useConfig()
  const { t } = useTranslation<PluginSearchTranslations, PluginSearchTranslationKeys>()

  const {
    routes: {
      admin: adminRoute, // already includes leading slash
    },
    serverURL,
  } = config

  const { value } = useField<{ relationTo?: string; value?: string }>({ path: 'doc' })

  if (!value?.relationTo || !value?.value) {
    return null
  }

  const href = formatAdminURL({
    adminRoute,
    path: `/collections/${value.relationTo || ''}/${value.value || ''}`,
    serverURL,
  })

  return (
    <div style={{ marginBottom: 'var(--spacing-field, 1rem)' }}>
      <div>
        <span
          className="label"
          style={{
            color: '#9A9A9A',
          }}
        >
          {typeof label === 'string' ? label : t('plugin-search:resultDocumentUrl')}
        </span>
        <CopyToClipboard value={href} />
      </div>
      <div
        style={{
          fontWeight: '600',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <Link href={href} rel="noopener noreferrer" target="_blank">
          {href}
        </Link>
      </div>
    </div>
  )
}
