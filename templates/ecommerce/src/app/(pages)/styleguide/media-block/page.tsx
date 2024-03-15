import type { Metadata } from 'next'

import Link from 'next/link'
import React, { Fragment } from 'react'

import staticImage from '../../../../../public/static-image.jpg'
import { MediaBlock } from '../../../_blocks/MediaBlock'
import { Gutter } from '../../../_components/Gutter'
import { VerticalPadding } from '../../../_components/VerticalPadding'
import { mergeOpenGraph } from '../../../_utilities/mergeOpenGraph'

export default async function MediaBlockPage() {
  return (
    <Fragment>
      <Gutter>
        <p>
          <Link href="/styleguide">Styleguide</Link>
          {' / '}
          <span>Media Block</span>
        </p>
        <h1>Media Block</h1>
      </Gutter>
      <VerticalPadding bottom="large" top="none">
        <MediaBlock blockType="mediaBlock" media="" position="default" staticImage={staticImage} />
        <br />
        <br />
        <MediaBlock
          blockType="mediaBlock"
          media=""
          position="fullscreen"
          staticImage={staticImage}
        />
      </VerticalPadding>
    </Fragment>
  )
}

export const metadata: Metadata = {
  description: 'Styleguide for media block.',
  openGraph: mergeOpenGraph({
    title: 'Media Block',
    url: '/styleguide/media-block',
  }),
  title: 'Media Block',
}
