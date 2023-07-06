import React from 'react'
import Link from 'next/link'

import { Gutter } from '../components/Gutter'

const Home: React.FC = () => {
  return (
    <Gutter>
      <h1>Home</h1>
      <p>
        {'This is a '}
        <Link href="https://nextjs.org/">Next.js</Link>
        {" app made explicitly for Payload's "}
        <Link href="https://github.com/payloadcms/payload/tree/master/examples/auth/cms">
          Auth Example
        </Link>
        {". This example demonstrates how to implement Payload's "}
        <Link href="https://payloadcms.com/docs/authentication/overview">Authentication</Link>
        {' strategies in both the REST and GraphQL APIs.'}
      </p>
      <p>
        {'Visit the '}
        <Link href="/login">Login</Link>
        {' page to start the authentication flow. Once logged in, you will be redirected to the '}
        <Link href="/account">Account</Link>
        {` page which is restricted to user's only. To toggle APIs, simply toggle the "api" prop in _app.tsx between "rest" and "gql".`}
      </p>
    </Gutter>
  )
}

export default Home
