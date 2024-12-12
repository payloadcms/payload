'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import React from 'react'

import type { Page as PageType } from '../../../../payload-types.js'

import { localizedPageTitleID, renderedPageTitleID } from '../../../../shared.js'
import { PAYLOAD_SERVER_URL } from '../../_api/serverURL.js'
import { Blocks } from '../../_components/Blocks/index.js'
import { Gutter } from '../../_components/Gutter/index.js'
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
      <Gutter>
        <div id={renderedPageTitleID}>{`For Testing: ${data.title}`}</div>
        <div id={localizedPageTitleID}>
          {`For Testing (Localized): ${typeof data.relationToLocalized === 'string' ? data.relationToLocalized : data.relationToLocalized?.localizedTitle}`}
        </div>
      </Gutter>
    </React.Fragment>
  )
}
