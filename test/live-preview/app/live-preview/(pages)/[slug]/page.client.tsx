'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import React from 'react'

import type { Page as PageType } from '../../../../payload-types.js'

import { renderedPageTitleID } from '../../../../shared.js'
import { Blocks } from '../../_components/Blocks/index.js'
import { Gutter } from '../../_components/Gutter/index.js'
import { Hero } from '../../_components/Hero/index.js'
import { PAYLOAD_SERVER_URL } from '../../serverURL.js'

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
      <Gutter>
        <div id={renderedPageTitleID}>{data.title}</div>
      </Gutter>
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
