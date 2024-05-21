import React from 'react'

import { Button } from '../../components/Button'

export default function NotFound() {
  return (
    <div className="py-28">
      <h1 style={{ marginBottom: 0 }}>404</h1>
      <p>This page could not be found.</p>
      <Button appearance="primary" href="/" label="Go Home" />
    </div>
  )
}
