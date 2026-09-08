'use client'

import { Banner, Button } from '@payloadcms/ui'
import { useState } from 'react'

type Props = {
  loginURL: string
  logoutFunction: () => Promise<unknown>
}

export const LogoutButton = ({ loginURL, logoutFunction }: Props) => {
  const [error, setError] = useState<null | string>(null)
  const [isPending, setIsPending] = useState(false)

  const handleLogout = async () => {
    setError(null)
    setIsPending(true)

    try {
      await logoutFunction()
      window.location.assign(loginURL)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Logout failed')
      setIsPending(false)
    }
  }

  return (
    <div>
      <Button disabled={isPending} onClick={handleLogout}>
        Custom Logout
      </Button>
      {error && (
        <div role="alert">
          <Banner type="danger">{error}</Banner>
        </div>
      )}
    </div>
  )
}
