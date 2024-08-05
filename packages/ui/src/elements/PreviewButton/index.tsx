'use client'
import React from 'react'

import { Button } from '../Button/index.js'
import { usePreviewURL } from './usePreviewURL.js'

const baseClass = 'preview-btn'

const DefaultPreviewButton: React.FC = () => {
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

type Props = {
  CustomComponent?: React.ReactNode
}

export const PreviewButton: React.FC<Props> = ({ CustomComponent }) => {
  if (CustomComponent) return CustomComponent

  return <DefaultPreviewButton />
}
