import type { Metadata } from 'next'

import Link from 'next/link'
import React, { Fragment } from 'react'

import { CallToActionBlock } from '../../../_blocks/CallToAction'
import { Button } from '../../../_components/Button'
import { Gutter } from '../../../_components/Gutter'
import { VerticalPadding } from '../../../_components/VerticalPadding'
import { mergeOpenGraph } from '../../../_utilities/mergeOpenGraph'

export default async function ButtonsPage() {
  return (
    <Fragment>
      <Gutter>
        <p>
          <Link href="/styleguide">Styleguide</Link>
          {' / '}
          <span>Buttons</span>
        </p>
        <h1>Buttons</h1>
      </Gutter>
      <Gutter>
        <VerticalPadding bottom="large" top="none">
          <Button appearance="default" label="Default Button" />
          <br /> <br />
          <Button appearance="primary" label="Primary Button" />
          <br /> <br />
          <Button appearance="secondary" label="Secondary Button" />
        </VerticalPadding>
      </Gutter>
    </Fragment>
  )
}

export const metadata: Metadata = {
  description: 'Styleguide for Buttons',
  openGraph: mergeOpenGraph({
    title: 'Buttons',
    url: '/styleguide/buttons',
  }),
  title: 'Buttons',
}
