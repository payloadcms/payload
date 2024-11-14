'use client'
import React from 'react'

import { Button } from '../Button/index.js'
import { usePreviewURL } from './usePreviewURL.js'

const baseClass = 'preview-btn'

export const PreviewButton: React.FC = () => {
  const { generatePreviewURL, label } = usePreviewURL()

  return (
    <Button
      buttonStyle="secondary"
      className={baseClass}
      icon={'link'}
      iconPosition="left"
      // disabled={disabled}
      onClick={() =>
        generatePreviewURL({
          openPreviewWindow: true,
        })
      }
      size="medium"
    >
      {label}
    </Button>
  )
}
