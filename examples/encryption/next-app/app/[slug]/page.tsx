import React from 'react'
import { notFound } from 'next/navigation'
import { Page, User } from '../../payload-types'
import { fetchPage } from '../_api/fetchPage'
import { fetchPages } from '../_api/fetchPages'
import { fetchUser } from '../_api/fetchUser'
import { Gutter } from '../_components/Gutter'
import RichText from '../_components/RichText'
import { VerticalPadding } from '../_components/VerticalPadding'
import { DateOfBirth } from '../_components/DateOfBirth'

import classes from './index.module.scss'

interface PageParams {
  params: { slug: string }
}

export const PageTemplate: React.FC<{
  page: Page | null | undefined,
  user: User | null | undefined
}> = ({ page, user }) => {
  return (
    <React.Fragment>
      <VerticalPadding
        top='small'
        bottom='small'
      >
        <Gutter>
          <h1>{page?.title}</h1>
          <RichText content={page?.content} />
          <p className={classes.dobTitle}>Date of Birth</p>
          <DateOfBirth user={user} />
          <p>This approach is useful for adding a layer of security for sensitive data. The database will store the encrypted value and the client will need to specifically request the data. To take this further you can add <a href='https://payloadcms.com/docs/access-control/fields' target='_blank'>field level access control</a> to these fields.</p>
        </Gutter>
      </VerticalPadding>
    </React.Fragment>
  )
}

export default async function Page({ params: { slug = 'home' } }: PageParams) {
  const page = await fetchPage(slug)

  if (page === null) {
    return notFound()
  }

  const user = await fetchUser()

  return <PageTemplate page={page} user={user} />
}

export async function generateStaticParams() {
  const pages = await fetchPages()

  return pages.map(({ slug }) =>
    slug !== 'home'
      ? {
        slug,
      }
      : {},
  ) // eslint-disable-line function-paren-newline
}
