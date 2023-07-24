import React, { Fragment } from 'react'
import { notFound } from 'next/navigation'

import { Page } from './../payload-types'
import { Gutter } from './_components/Gutter'
import { RichText } from './_components/RichText'

import classes from './page.module.scss'

export default async function Home() {
  const home: Page = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/pages?where[slug][equals]=home`,
  )
    .then(res => res.json())
    .then(res => res?.docs?.[0])

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
