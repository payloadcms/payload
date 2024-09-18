import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import { Button } from '@/components/ui/button'
import { LowImpactHero } from '@/heros/LowImpact'
import { getMeUser } from '@/utilities/getMeUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import React, { Fragment } from 'react'

import { AccountForm } from './AccountForm'

export default async function Account() {
  const { user } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to access your account.',
    )}&redirect=${encodeURIComponent('/account')}`,
  })

  return (
    <div>
      <div className="container">
        <RenderParams className="" />
      </div>
      <LowImpactHero
        media={null}
        richText={{
          root: {
            type: 'root',
            children: [
              {
                type: 'heading',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Account',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                tag: 'h1',
                version: 1,
              },
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'This is your account dashboard. Here you can update your account information, view your purchased products, and browse your order history. To manage all users, ',
                    version: 1,
                  },
                  {
                    id: '667b3cdc87e3d17ac1b11ece',
                    type: 'link',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'login to the admin dashboard',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    fields: {
                      linkType: 'custom',
                      newTab: false,
                      url: '/admin/collections/users',
                    },
                    format: '',
                    indent: 0,
                    version: 3,
                  },
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: '.',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                textFormat: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        }}
        type="lowImpact"
      />
      <div className="container mt-16 pb-8">
        <AccountForm />

        <hr className="my-16" />
        <div className="prose dark:prose-invert mb-8">
          <h2>Orders</h2>
          <p>
            These are the orders you have placed over time. Each order is associated with an payment
            intent. As you place more orders, they will appear in your orders list.
          </p>
        </div>
        <Button asChild variant="default">
          <Link href="/orders">View orders</Link>
        </Button>
        <hr className="mt-16 mb-8" />
        <Button asChild variant="outline">
          <Link href="/logout">Log out</Link>
        </Button>
      </div>
    </div>
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
