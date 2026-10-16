import type { ServerProps } from 'payload'

import { Banner } from '@payloadcms/ui'
import React from 'react'

import { postsSlug } from '../../shared.js'
import { ClickCounter } from '../ClickCounter/index.js'

/** A custom server component, compiled by the admin runtime instead of Next.js. */
export const BeforeDashboard = async ({ payload, user }: ServerProps) => {
  const { totalDocs } = await payload.count({ collection: postsSlug, overrideAccess: false, user })

  return (
    <Banner type="success">
      <span id="admin-runtime-server-component">{totalDocs} posts</span> <ClickCounter />
    </Banner>
  )
}
