'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'

import { Page } from '../../payload-types'
import { Gutter } from '../_components/Gutter'
import RichText from '../_components/RichText'

import classes from './index.module.scss'

export const PageTemplate: React.FC<{ page: Page | null | undefined }> = ({ page }) => {
  const { data } = useLivePreview({
    serverURL: process.env.NEXT_PUBLIC_PAYLOAD_URL || '',
    depth: 2,
    initialData: page,
  })

  return (
    <main className={classes.page}>
      <Gutter>
        <RichText content={data?.richText} />
      </Gutter>
    </main>
  )
}
