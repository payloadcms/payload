'use client'

import React from 'react'
import { PAYLOAD_SERVER_URL } from './api'
// The `useLivePreview` hook is imported from the monorepo for development purposes only
// in your own app you would import this hook directly from the package itself
// i.e. `import { useLivePreview } from '@payloadcms/live-preview-react'`
// If you are using another framework, look for the equivalent packages for your framework
import { useLivePreview } from '../../../../packages/live-preview-react'
import { Page as PageType } from '@/payload-types'
import { Hero } from './_components/Hero'
import { Blocks } from './_components/Blocks'

export type Props = {
  initialPage: PageType
}

export const Page: React.FC<Props> = (props) => {
  const { initialPage } = props

  const { data, isLoading } = useLivePreview<PageType>({
    initialPage,
    serverURL: PAYLOAD_SERVER_URL,
  })

  return (
    <main>
      <Hero {...data?.hero} />
      <Blocks
        blocks={data?.layout}
        disableTopPadding={
          !data?.hero || data?.hero?.type === 'none' || data?.hero?.type === 'lowImpact'
        }
      />
    </main>
  )
}
