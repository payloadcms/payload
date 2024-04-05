import type { LivePreviewConfig } from 'payload/config'
import type { EditViewComponent } from 'payload/types'

import React from 'react'

import { LivePreviewClient } from './index.client.js'
import './index.scss'

export const LivePreviewView: EditViewComponent = async (props) => {
  const { initPageResult } = props

  const {
    collectionConfig,
    globalConfig,
    locale,
    req: {
      payload: {
        config: {
          admin: { livePreview: topLevelLivePreviewConfig },
        },
      } = {},
    } = {},
  } = initPageResult

  // TODO(JAKE): not sure what `data` is or what it should be
  const data = 'data' in props ? props.data : {}

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

  return <LivePreviewClient breakpoints={breakpoints} initialData={data} url={url} />
}
