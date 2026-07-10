import { PayloadAdminBar } from '@payloadcms/admin-bar'
import { createFileRoute } from '@tanstack/react-router'
import React, { useMemo } from 'react'

export const Route = createFileRoute('/admin-bar')({
  component: AdminBarPage,
})

function AdminBarPage() {
  const cmsURL = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'http://localhost:3000'
    }
    return window.location.origin
  }, [])

  return (
    <div>
      <PayloadAdminBar
        adminPath="/admin"
        apiPath="/api"
        cmsURL={cmsURL}
        collectionSlug="posts"
        devMode
        id="1"
      />
      <br />
      <h1>Payload Admin Bar</h1>
    </div>
  )
}
