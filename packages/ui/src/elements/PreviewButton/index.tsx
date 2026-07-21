'use client'
import type { PreviewButtonClientProps } from 'payload'

import React, { useState } from 'react'

import { LinkIcon } from '../../icons/Link/index.js'
import { usePreviewURL } from '../../providers/LivePreview/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Tooltip } from '../Tooltip/index.js'

export function PreviewButton(_props: PreviewButtonClientProps) {
  const { previewURL } = usePreviewURL()
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)

  if (!previewURL) {
    return null
  }

  return (
    <span
      onPointerEnter={() => {
        setHovered(true)
      }}
      onPointerLeave={() => {
        setHovered(false)
      }}
      style={{ position: 'relative' }}
    >
      <Button
        buttonStyle="ghost"
        el="anchor"
        icon={<LinkIcon size={24} />}
        id="preview-button"
        newTab
        url={previewURL}
      />
      <Tooltip delay={0} show={hovered}>
        {t('general:preview')}
      </Tooltip>
    </span>
  )
}
