'use client'
import type { PreviewButtonClientProps } from 'payload'

import React from 'react'

import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLivePreviewContext } from '../../providers/LivePreview/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { useDrawerDepth } from '../Drawer/index.js'
import { usePreviewURL } from './usePreviewURL.js'

const baseClass = 'preview-btn'

export function PreviewButton(props: PreviewButtonClientProps) {
  const { generatePreviewURL, label } = usePreviewURL()
  const { isLivePreviewEnabled } = useLivePreviewContext()
  const drawerDepth = useDrawerDepth()
  const { isLivePreviewing, setIsLivePreviewing } = useLivePreviewContext()
  const { docConfig } = useDocumentInfo()

  const { t } = useTranslation()

  if (isLivePreviewEnabled && drawerDepth <= 1) {
    return (
      <Button
        aria-label={isLivePreviewing ? t('general:exitLivePreview') : t('general:livePreview')}
        buttonStyle={isLivePreviewing ? 'primary' : 'secondary'}
        className={[baseClass, isLivePreviewing && `${baseClass}--active`]
          .filter(Boolean)
          .join(' ')}
        id="live-preview-toggler"
        onClick={(e) => {
          if (docConfig?.admin?.preview && (e.metaKey || e.ctrlKey)) {
            generatePreviewURL({
              openPreviewWindow: true,
            })
          } else {
            setIsLivePreviewing(!isLivePreviewing)
          }
        }}
        size="medium"
      >
        {label}
      </Button>
    )
  }

  return (
    <Button
      buttonStyle="secondary"
      className={baseClass}
      onClick={() => {
        generatePreviewURL({
          openPreviewWindow: true,
        })
      }}
      size="medium"
    >
      {label}
    </Button>
  )
}
