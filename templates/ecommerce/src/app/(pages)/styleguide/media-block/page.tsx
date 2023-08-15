import React, { Fragment } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'

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
        <MediaBlock position="default" blockType="mediaBlock" media="" staticImage={staticImage} />
        <br />
        <br />
        <MediaBlock
          position="fullscreen"
          blockType="mediaBlock"
          media=""
          staticImage={staticImage}
        />
      </VerticalPadding>
    </Fragment>
  )
}

export const metadata: Metadata = {
  title: 'Media Block',
  description: 'Styleguide for media block.',
  openGraph: mergeOpenGraph({
    title: 'Media Block',
    url: '/styleguide/media-block',
  }),
}
