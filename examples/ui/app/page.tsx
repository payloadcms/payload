import Link from 'next/link'

import { Gutter } from './_components/Gutter'

export default function Home() {
  return (
    <Gutter>
      <h1>Payload UI Example</h1>
      <p>
        {'This is a '}
        <Link href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
          Next.js
        </Link>
        {' app using the '}
        <Link href="https://nextjs.org/docs/app" target="_blank" rel="noopener noreferrer">
          App Router
        </Link>
        {' made explicitly for the '}
        <Link href="https://github.com/payloadcms/payload/tree/main/examples/auth">
          Payload UI Example
        </Link>
        {
          ". This example demonstrates how to implement Payload's UI Library in any React application, outside the context of the Admin Panel."
        }
      </p>
      <Link href="/fields">Fields</Link>
      <br />
      <Link href="/components">Components</Link>
    </Gutter>
  )
}
