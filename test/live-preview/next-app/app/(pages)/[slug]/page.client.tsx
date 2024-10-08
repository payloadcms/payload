'use client'

import { Page as PageType } from '@/payload-types'
import { useLivePreview } from '../../../../../../packages/live-preview-react/src'
import React from 'react'
import { PAYLOAD_SERVER_URL } from '@/app/_api/serverURL'
import { Hero } from '@/app/_components/Hero'
import { Blocks } from '@/app/_components/Blocks'

export type PageClientProps = {
  page: PageType
}

export const PageClient = ({ page: initialPage }: PageClientProps) => {
  const { data } = useLivePreview<PageType>({
    initialData: initialPage,
    serverURL: PAYLOAD_SERVER_URL,
    depth: 2,
  })

  return (
    <React.Fragment>
      <Hero {...data?.hero} />
      <Blocks
        blocks={[
          ...(data?.layout ?? []),
          {
            blockType: 'relationships',
            blockName: 'Relationships',
            data: data,
          },
        ]}
        disableTopPadding={
          !data?.hero || data?.hero?.type === 'none' || data?.hero?.type === 'lowImpact'
        }
      />
    </React.Fragment>
  )
}
