'use client'
import type { PreviewButtonClientProps } from 'payload'

import React from 'react'

import { ExternalLinkIcon } from '../../icons/ExternalLink/index.js'
import { usePreviewURL } from './usePreviewURL.js'
import './index.scss'

const baseClass = 'preview-btn'

export function PreviewButton(props: PreviewButtonClientProps) {
  const { generatePreviewURL, label } = usePreviewURL()

  return (
    <button
      aria-label={label}
      className={baseClass}
      id="preview-button"
      onClick={() => {
        generatePreviewURL({
          openPreviewWindow: true,
        })
      }}
      title={label}
      type="button"
    >
      <ExternalLinkIcon />
    </button>
  )
}
