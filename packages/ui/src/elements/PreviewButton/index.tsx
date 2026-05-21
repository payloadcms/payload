'use client'
import type { PreviewButtonClientProps } from 'payload'

import React from 'react'

import { ExternalLinkIcon } from '../../icons/ExternalLink/index.js'
import { usePreviewURL } from '../../providers/LivePreview/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'

export function PreviewButton(props: PreviewButtonClientProps) {
  const { previewURL } = usePreviewURL()
  const { t } = useTranslation()

  if (!previewURL) {
    return null
  }

  const label = t('version:preview')

  return (
    <Button
      aria-label={label}
      buttonStyle="ghost"
      icon={<ExternalLinkIcon size={16} />}
      id="preview-button"
      newTab
      tooltip={label}
      url={previewURL}
    />
  )
}
