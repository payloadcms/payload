'use client'
import type { PreviewButtonClientProps } from 'payload'

import React, { useCallback, useState } from 'react'

import { LinkIcon } from '../../icons/Link/index.js'
import { usePreviewURL } from '../../providers/LivePreview/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'

export function PreviewButton(props: PreviewButtonClientProps) {
  const { previewURL } = usePreviewURL()
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleClick = useCallback(async () => {
    if (previewURL) {
      await navigator.clipboard.writeText(previewURL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [previewURL])

  if (!previewURL) {
    return null
  }

  const label = copied ? t('general:copied') : t('general:copyLink')

  return (
    <Button
      aria-label={label}
      buttonStyle="ghost"
      icon={<LinkIcon size={16} />}
      id="preview-button"
      onClick={handleClick}
      tooltip={label}
    />
  )
}
