import type { Metadata } from 'next'

import Link from 'next/link'
import React, { Fragment } from 'react'

import { CallToActionBlock } from '../../../_blocks/CallToAction'
import { Gutter } from '../../../_components/Gutter'
import { VerticalPadding } from '../../../_components/VerticalPadding'
import { mergeOpenGraph } from '../../../_utilities/mergeOpenGraph'

export default async function CallToActionPage() {
  return (
    <Fragment>
      <Gutter>
        <p>
          <Link href="/styleguide">Styleguide</Link>
          {' / '}
          <span>Call To Action Block</span>
        </p>
        <h1>Call To Action Block</h1>
      </Gutter>
      <VerticalPadding bottom="large" top="none">
        <CallToActionBlock
          blockType="cta"
          links={[
            {
              link: {
                type: 'custom',
                appearance: 'primary',
                label: 'Lorem ipsum dolor sit amet',
                reference: null,
                url: '#',
              },
            },
          ]}
          richText={[
            {
              type: 'h4',
              children: [
                {
                  text: 'Lorem ipsum dolor sit amet',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                },
              ],
            },
          ]}
        />
        <br />
        <br />
        <CallToActionBlock
          blockType="cta"
          invertBackground
          links={[
            {
              link: {
                type: 'custom',
                appearance: 'primary',
                label: 'Lorem ipsum dolor sit amet',
                reference: null,
                url: '#',
              },
            },
          ]}
          richText={[
            {
              type: 'h4',
              children: [
                {
                  text: 'Lorem ipsum dolor sit amet',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                },
              ],
            },
          ]}
        />
      </VerticalPadding>
    </Fragment>
  )
}

export const metadata: Metadata = {
  description: 'Styleguide for the Call To Action Block',
  openGraph: mergeOpenGraph({
    title: 'Call To Action Block',
    url: '/styleguide/call-to-action',
  }),
  title: 'Call To Action Block',
}
