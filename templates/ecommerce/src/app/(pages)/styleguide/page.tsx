import React from 'react'
import Link from 'next/link'

import { Gutter } from '../../_components/Gutter'

export default async function Typography() {
  return (
    <Gutter>
      <h1>Styleguide</h1>
      <Link href="/styleguide/typography">Typography</Link>
      <br />
      <Link href="/styleguide/content-block">Content Block</Link>
      <br />
      <Link href="/styleguide/media-block">Media Block</Link>
    </Gutter>
  )
}
