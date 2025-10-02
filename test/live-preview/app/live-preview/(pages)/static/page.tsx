import { Gutter } from '@payloadcms/ui'

import React, { Fragment } from 'react'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function TestPage(args: Args) {
  return (
    <Fragment>
      <Gutter>
        <p>This is a static page for testing.</p>
      </Gutter>
    </Fragment>
  )
}
