'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import React from 'react'

import type { Page as PageType } from '../../../../test/live-preview/payload-types.js'

import { PAYLOAD_SERVER_URL } from '../../_api/serverURL.js'
import { Blocks } from '../../_components/Blocks/index.js'
import { Hero } from '../../_components/Hero/index.js'

export const PageClient: React.FC<{
  page: PageType
}> = ({ page: initialPage }) => {
  const { data } = useLivePreview<PageType>({
    depth: 2,
    initialData: initialPage,
    serverURL: PAYLOAD_SERVER_URL,
  })

  return (
    <React.Fragment>
      <Hero {...data?.hero} />
      <Blocks
        blocks={[
          ...(data?.layout ?? []),
          {
            blockName: 'Relationships',
            blockType: 'relationships',
            data,
          },
        ]}
        disableTopPadding={
          !data?.hero || data?.hero?.type === 'none' || data?.hero?.type === 'lowImpact'
        }
      />
    </React.Fragment>
  )
}
