import type { LivePreviewConfig } from 'payload/config'

import React from 'react'

import type { ServerSideEditViewProps } from '../Edit/types'

import { sanitizeEditViewProps } from '../Edit/sanitizeEditViewProps'
import { LivePreviewClient } from './index.client'
import './index.scss'

export const LivePreviewView: React.FC<ServerSideEditViewProps> = async (props) => {
  const {
    collectionConfig,
    config: {
      admin: { livePreview: topLevelLivePreviewConfig },
    },
    data,
    globalConfig,
    locale,
  } = props

  let livePreviewConfig: LivePreviewConfig = topLevelLivePreviewConfig

  if (collectionConfig) {
    livePreviewConfig = {
      ...(livePreviewConfig || {}),
      ...(collectionConfig.admin.livePreview || {}),
    }
  }

  if (globalConfig) {
    livePreviewConfig = {
      ...(livePreviewConfig || {}),
      ...(globalConfig.admin.livePreview || {}),
    }
  }

  const breakpoints: LivePreviewConfig['breakpoints'] = [
    ...(livePreviewConfig?.breakpoints || []),
    {
      name: 'responsive',
      height: '100%',
      label: 'Responsive',
      width: '100%',
    },
  ]

  const url =
    typeof livePreviewConfig?.url === 'function'
      ? await livePreviewConfig.url({
          data,
          documentInfo: {}, // TODO: recreate this object server-side, see `useDocumentInfo`
          locale,
        })
      : livePreviewConfig?.url

  const clientSideProps = sanitizeEditViewProps(props)

  return (
    <LivePreviewClient
      {...clientSideProps}
      breakpoints={breakpoints}
      initialData={data}
      livePreviewConfig={livePreviewConfig}
      url={url}
    />
  )
}
