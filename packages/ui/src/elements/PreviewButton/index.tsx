'use client'
import type { PreviewButtonClientProps } from 'payload'

import React, { useCallback, useState } from 'react'

import { LinkIcon } from '../../icons/Link/index.js'
import { usePreviewURL } from '../../providers/LivePreview/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Tooltip } from '../Tooltip/index.js'

export function PreviewButton(_props: PreviewButtonClientProps) {
  const { previewURL } = usePreviewURL()
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!previewURL) {
        return
      }

      // Cmd/Ctrl + click opens the preview URL in a new tab
      if (event.metaKey || event.ctrlKey) {
        window.open(previewURL, '_blank', 'noopener,noreferrer')
        return
      }

      await navigator.clipboard.writeText(previewURL)
      setCopied(true)
    },
    [previewURL],
  )

  if (!previewURL) {
    return null
  }

  const label = copied ? t('general:copied') : t('general:copy')

  return (
    <span
      onPointerEnter={() => {
        setHovered(true)
        setCopied(false)
      }}
      onPointerLeave={() => {
        setHovered(false)
        setCopied(false)
      }}
      style={{ position: 'relative' }}
    >
      <Button
        buttonStyle="ghost"
        icon={<LinkIcon size={24} />}
        id="preview-button"
        onClick={handleClick}
      />
      <Tooltip delay={0} show={hovered || copied}>
        {label}
      </Tooltip>
    </span>
  )
}
