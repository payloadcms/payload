import type { DocumentViewServerProps, LivePreviewConfig } from 'payload'

import React from 'react'

import './index.scss'
import { LivePreviewClient } from './index.client.js'

export async function LivePreviewView(props: DocumentViewServerProps) {
  const { doc, initPageResult } = props

  const { collectionConfig, globalConfig, locale, req } = initPageResult

  let livePreviewConfig: LivePreviewConfig = req.payload.config?.admin?.livePreview

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
          collectionConfig,
          data: doc,
          globalConfig,
          locale,
          req,
          /**
           * @deprecated
           * Use `req.payload` instead. This will be removed in the next major version.
           */
          payload: initPageResult.req.payload,
        })
      : livePreviewConfig?.url

  return (
    <LivePreviewClient
      breakpoints={breakpoints}
      Description={props.Description}
      initialData={doc}
      PreviewButton={props.PreviewButton}
      PublishButton={props.PublishButton}
      SaveButton={props.SaveButton}
      SaveDraftButton={props.SaveDraftButton}
      Upload={props.Upload}
      url={url}
    />
  )
}
