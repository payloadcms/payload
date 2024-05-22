import Link from 'next/link'
import React from 'react'

import { Button } from '../../components/ui/button'

export default function NotFound() {
  return (
    <div className="py-28">
      <h1 style={{ marginBottom: 0 }}>404</h1>
      <p>This page could not be found.</p>
      <Button asChild variant="default">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  )
}
