import React, { Fragment } from 'react'
import Link from 'next/link'

import staticImage from '../../../../../public/static-image.jpg'
import { ContentBlock } from '../../../_blocks/Content'
import { Gutter } from '../../../_components/Gutter'

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
      <div>
        <ContentBlock
          blockType="content"
          columns={[
            {
              size: 'full',
              richText: [
                {
                  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                },
              ],
            },
          ]}
        />
      </div>
    </Fragment>
  )
}
