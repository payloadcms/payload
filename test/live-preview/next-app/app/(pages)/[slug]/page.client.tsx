'use client'

import type { Page as PageType } from '@/payload-types'

import { PAYLOAD_SERVER_URL } from '@/app/_api/serverURL'
import { Blocks } from '@/app/_components/Blocks'
import { Hero } from '@/app/_components/Hero'
import React from 'react'

import { useLivePreview } from '../../../../../../packages/live-preview-react/src'

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
