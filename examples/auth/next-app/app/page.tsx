import Link from 'next/link'

import { Gutter } from './_components/Gutter'

export default function Home() {
  return (
    <Gutter>
      <h1>Payload Auth Example</h1>
      <p>
        {'This is a '}
        <Link href="https://payloadcms.com" target="_blank" rel="noopener noreferrer">
          Payload
        </Link>
        {' + '}
        <Link href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
          Next.js
        </Link>
        {' app using the '}
        <Link href="https://nextjs.org/docs/app" target="_blank" rel="noopener noreferrer">
          App Router
        </Link>
        {' made explicitly for the '}
        <Link href="https://github.com/payloadcms/payload/tree/main/examples/auth">
          Payload Auth Example
        </Link>
        {". This example demonstrates how to implement Payload's "}
        <Link href="https://payloadcms.com/docs/authentication/overview">Authentication</Link>
        {
          ' strategies in both the REST and GraphQL APIs. To toggle between these APIs, see `_layout.tsx`.'
        }
      </p>
      <p>
        {'Visit the '}
        <Link href="/login">login page</Link>
        {' to start the authentication flow. Once logged in, you will be redirected to the '}
        <Link href="/account">account page</Link>
        {` which is restricted to users only. To manage all users, `}
        <Link href={`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/admin/collections/users`}>
          login to the admin dashboard
        </Link>
        {'.'}
      </p>
    </Gutter>
  )
}
