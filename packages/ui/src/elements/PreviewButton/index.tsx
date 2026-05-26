'use client'
import type { PreviewButtonClientProps } from 'payload'

import React, { useCallback, useState } from 'react'

import { LinkIcon } from '../../icons/Link/index.js'
import { usePreviewURL } from '../../providers/LivePreview/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Tooltip } from '../Tooltip/index.js'

export function PreviewButton(props: PreviewButtonClientProps) {
  const { previewURL } = usePreviewURL()
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleClick = useCallback(async () => {
    if (previewURL) {
      await navigator.clipboard.writeText(previewURL)
      setCopied(true)
    }
  }, [previewURL])

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
        aria-label={label}
        buttonStyle="ghost"
        icon={<LinkIcon size={16} />}
        id="preview-button"
        onClick={handleClick}
      />
      <Tooltip delay={0} show={hovered || copied}>
        {label}
      </Tooltip>
    </span>
  )
}
