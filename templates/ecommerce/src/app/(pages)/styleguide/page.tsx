import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'

import { Gutter } from '../../_components/Gutter'
import { VerticalPadding } from '../../_components/VerticalPadding'
import { mergeOpenGraph } from '../../_utilities/mergeOpenGraph'

export default async function Typography() {
  return (
    <Gutter>
      <VerticalPadding bottom="large" top="none">
        <h1>Styleguide</h1>
        <Link href="/styleguide/typography">Typography</Link>
        <br />
        <h2>Blocks</h2>
        <Link href="/styleguide/content-block">Content Block</Link>
        <br />
        <Link href="/styleguide/media-block">Media Block</Link>
        <br />
        <Link href="/styleguide/call-to-action">Call To Action Block</Link>
        <br />
        <h2>Components</h2>
        <Link href="/styleguide/buttons">Buttons</Link>
        <br />
        <Link href="/styleguide/message">Message</Link>
      </VerticalPadding>
    </Gutter>
  )
}

export const metadata: Metadata = {
  title: 'Styleguide',
  description: 'Styleguide',
  openGraph: mergeOpenGraph({
    title: 'Styleguide',
    url: '/styleguide',
  }),
}
