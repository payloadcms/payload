import type { LivePreviewConfig } from 'payload/config'

import React from 'react'

import type { InitPageResult } from '../../utilities/initPage'

import { LivePreviewClient } from './index.client'
import './index.scss'

type Props = {
  page: InitPageResult
  params: { [key: string]: string | string[] }
  searchParams: { [key: string]: string | string[] | undefined }
}
export const LivePreviewView: React.FC = async (props: Props) => {
  const { page } = props
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
  } = page

  // TODO(JAKE): not sure what `data` is or what it should be
  const { data = {} } = props

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

  return (
    <React.Fragment>
      <LivePreviewClient
        breakpoints={breakpoints}
        collectionSlug={collectionConfig?.slug}
        globalSlug={globalConfig?.slug}
        initialData={data}
        livePreviewConfig={livePreviewConfig}
        url={url}
      />
    </React.Fragment>
  )
}
