import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { getPayload } from 'payload'
import React, { Fragment } from 'react'

import config from '../../payload.config'
import { Gutter } from './_components/Gutter'
import { HydrateClientUser } from './_components/HydrateClientUser'

export default async function HomePage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { permissions, user } = await payload.auth({ headers })

  return (
    <Fragment>
      <HydrateClientUser permissions={permissions} user={user} />
      <Gutter>
        <h1>Payload Auth Example</h1>
        <p>
          {'This is a '}
          <Link href="https://payloadcms.com" rel="noopener noreferrer" target="_blank">
            Payload
          </Link>
          {' + '}
          <Link href="https://nextjs.org" rel="noopener noreferrer" target="_blank">
            Next.js
          </Link>
          {' app using the '}
          <Link href="https://nextjs.org/docs/app" rel="noopener noreferrer" target="_blank">
            App Router
          </Link>
          {' made explicitly for the '}
          <Link href="https://github.com/payloadcms/payload/tree/main/examples/auth">
            Payload Auth Example
          </Link>
          {". This example demonstrates how to implement Payload's "}
          <Link href="https://payloadcms.com/docs/authentication/overview">Authentication</Link>
          {
            ' strategies using the Local API, as well as through HTTP via the REST and GraphQL APIs. To toggle between these two HTTP APIs, see `_layout.tsx`.'
          }
        </p>
        <p>
          {'Visit the '}
          <Link href="/login">login page</Link>
          {' to start the authentication flow. Once logged in, you will be redirected to the '}
          <Link href="/account">account page</Link>
          {` which is restricted to users only. To manage all users, `}
          <Link href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/users`}>
            login to the admin dashboard
          </Link>
          .
        </p>
      </Gutter>
    </Fragment>
  )
}
