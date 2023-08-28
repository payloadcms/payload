import React, { Fragment } from 'react'
import { notFound } from 'next/navigation'

import { getPayloadClient } from '../getPayload'
import { Page } from './../payload-types'
import { Gutter } from './_components/Gutter'
import { RichText } from './_components/RichText'

import classes from './page.module.scss'

export default async function Home() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: {
      slug: {
        equals: 'home',
      },
    },
  })

  const home = docs?.[0] as Page

  if (!home) {
    return notFound()
  }

  return (
    <Fragment>
      <main className={classes.main}>
        <Gutter>
          <div className={classes.body}>
            <RichText content={home.richText} />
          </div>
        </Gutter>
      </main>
    </Fragment>
  )
}
