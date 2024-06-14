import type { EditViewComponent, LivePreviewConfig, TypeWithID } from 'payload'

import { notFound } from 'next/navigation.js'
import React from 'react'

import { LivePreviewClient } from './index.client.js'
import './index.scss'

export const LivePreviewView: EditViewComponent = async (props) => {
  const { initPageResult } = props

  const {
    collectionConfig,
    docID,
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

  let data: TypeWithID

  try {
    if (collectionConfig) {
      data = await initPageResult.req.payload.findByID({
        id: docID,
        collection: collectionConfig.slug,
        depth: 0,
        draft: true,
        fallbackLocale: null,
      })
    }

    if (globalConfig) {
      data = await initPageResult.req.payload.findGlobal({
        slug: globalConfig.slug,
        depth: 0,
        draft: true,
        fallbackLocale: null,
      })
    }
  } catch (error) {
    notFound()
  }

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
          collectionConfig,
          data,
          globalConfig,
          locale,
          payload: initPageResult.req.payload,
        })
      : livePreviewConfig?.url

  return <LivePreviewClient breakpoints={breakpoints} initialData={data} url={url} />
}
