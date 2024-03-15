import type { Metadata } from 'next'

import Link from 'next/link'
import React, { Fragment } from 'react'

import { fetchComments } from '../../_api/fetchComments'
import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { HR } from '../../_components/HR'
import { RenderParams } from '../../_components/RenderParams'
import { LowImpactHero } from '../../_heros/LowImpact'
import { formatDateTime } from '../../_utilities/formatDateTime'
import { getMeUser } from '../../_utilities/getMeUser'
import { mergeOpenGraph } from '../../_utilities/mergeOpenGraph'
import AccountForm from './AccountForm'
import classes from './index.module.scss'

export default async function Account() {
  const { user } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to access your account.',
    )}&redirect=${encodeURIComponent('/account')}`,
  })

  const comments = await fetchComments({
    user: user?.id,
  })

  return (
    <Fragment>
      <Gutter>
        <RenderParams className={classes.params} />
      </Gutter>
      <LowImpactHero
        media={null}
        richText={[
          {
            type: 'h1',
            children: [
              {
                text: 'Account',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                text: 'This is your account dashboard. Here you can update your account information, view your comment history, and more. To manage all users, ',
              },
              {
                type: 'link',
                children: [
                  {
                    text: 'login to the admin dashboard.',
                  },
                ],
                url: '/admin/collections/users',
              },
            ],
          },
        ]}
        type="lowImpact"
      />
      <Gutter className={classes.account}>
        <AccountForm />
        <HR />
        <h2>Comments</h2>
        <p>
          These are the comments you have placed over time. Each comment is associated with a
          specific post. All comments must be approved by an admin before they appear on the site.
        </p>
        <HR />
        {comments?.length === 0 && <p>You have not made any comments yet.</p>}
        {comments.length > 0 &&
          comments?.map((com, index) => {
            const { comment, createdAt, doc } = com

            if (!comment) return null

            return (
              <Fragment key={index}>
                <div className={classes.column}>
                  <p className={classes.comment}>"{comment}"</p>
                  <p className={classes.meta}>
                    {'Posted '}
                    {doc && typeof doc === 'object' && (
                      <Fragment>
                        {' to '}
                        <Link href={`/posts/${doc?.slug}`}>{doc?.title || 'Untitled Post'}</Link>
                      </Fragment>
                    )}
                    {createdAt && ` on ${formatDateTime(createdAt)}`}
                  </p>
                </div>
                {index < comments.length - 1 && <HR />}
              </Fragment>
            )
          })}
        <HR />
        <Button appearance="secondary" href="/logout" label="Log out" />
      </Gutter>
    </Fragment>
  )
}

export const metadata: Metadata = {
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
