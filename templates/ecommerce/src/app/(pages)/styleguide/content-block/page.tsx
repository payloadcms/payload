import type { Metadata } from 'next'

import Link from 'next/link'
import React, { Fragment } from 'react'

import { ContentBlock } from '../../../_blocks/Content'
import { Gutter } from '../../../_components/Gutter'
import { VerticalPadding } from '../../../_components/VerticalPadding'
import { mergeOpenGraph } from '../../../_utilities/mergeOpenGraph'

export default async function ContentBlockPage() {
  return (
    <Fragment>
      <Gutter>
        <p>
          <Link href="/styleguide">Styleguide</Link>
          {' / '}
          <span>Content Block</span>
        </p>
        <h1>Content Block</h1>
      </Gutter>
      <VerticalPadding bottom="large" top="none">
        <ContentBlock
          blockType="content"
          columns={[
            {
              richText: [
                {
                  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                },
              ],
              size: 'full',
            },
          ]}
        />
      </VerticalPadding>
    </Fragment>
  )
}

export const metadata: Metadata = {
  description: 'Styleguide for the Content Block',
  openGraph: mergeOpenGraph({
    title: 'Content Block',
    url: '/styleguide/content-block',
  }),
  title: 'Content Block',
}
