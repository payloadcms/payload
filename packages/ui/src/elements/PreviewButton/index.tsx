'use client'
import type { PreviewButtonClientProps } from '@ruya.sa/payload'

import React from 'react'

import { ExternalLinkIcon } from '../../icons/ExternalLink/index.js'
import './index.scss'
import { usePreviewURL } from '../../providers/LivePreview/context.js'
import { useTranslation } from '../../providers/Translation/index.js'

const baseClass = 'preview-btn'

export function PreviewButton(props: PreviewButtonClientProps) {
  const { previewURL } = usePreviewURL()
  const { t } = useTranslation()

  if (!previewURL) {
    return null
  }

  return (
    <a
      aria-label={t('version:preview')}
      className={baseClass}
      href={previewURL}
      id="preview-button"
      target="_blank"
      title={t('version:preview')}
    >
      <ExternalLinkIcon />
    </a>
  )
}
