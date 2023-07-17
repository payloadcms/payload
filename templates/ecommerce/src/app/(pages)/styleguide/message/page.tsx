import React, { Fragment } from 'react'
import Link from 'next/link'

import { Gutter } from '../../../_components/Gutter'
import { Message } from '../../../_components/Message'
import { VerticalPadding } from '../../../_components/VerticalPadding'

export default async function MessageComponentPage() {
  return (
    <Fragment>
      <Gutter>
        <p>
          <Link href="/styleguide">Styleguide</Link>
          {' / '}
          <span>Message Component</span>
        </p>
        <h1>Message Component</h1>
      </Gutter>
      <Gutter>
        <VerticalPadding bottom="large" top="none">
          <Message message="This is a message" />
          <br />
          <Message error="This is an error" />
          <br />
          <Message success="This is a success" />
          <br />
          <Message warning="This is a warning" />
        </VerticalPadding>
      </Gutter>
    </Fragment>
  )
}
