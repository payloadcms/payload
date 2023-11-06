'use client'

import { Page as PageType } from '@/payload-types'
import { useLivePreview } from '../../../../../../packages/live-preview-react'
import React from 'react'
import { PAYLOAD_SERVER_URL } from '@/app/_api/serverURL'
import { Hero } from '@/app/_components/Hero'
import { Blocks } from '@/app/_components/Blocks'

export const PageClient: React.FC<{
  page: PageType
}> = ({ page: initialPage }) => {
  const { data } = useLivePreview<PageType>({
    initialData: initialPage,
    serverURL: PAYLOAD_SERVER_URL,
    depth: 2,
  })

  console.log('data', data)

  return (
    <React.Fragment>
      <Hero {...data?.hero} />
      <p>Poly Has Many:</p>
      {JSON.stringify(data?.relationshipPolyHasMany)}
      <p>Poly Has One:</p>
      {JSON.stringify(data?.relationshipMonoHasMany)}
      <p>Mono Has One:</p>
      {JSON.stringify(data?.relationshipMonoHasOne)}
      <Blocks
        blocks={data?.layout}
        disableTopPadding={
          !data?.hero || data?.hero?.type === 'none' || data?.hero?.type === 'lowImpact'
        }
      />
    </React.Fragment>
  )
}
