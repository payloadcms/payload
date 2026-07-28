'use client'

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
    <div className="auth-server-functions__action">
      <button disabled={isPending} onClick={handleLogout} type="button">
        Custom Logout
      </button>
      {error && (
        <p className="auth-server-functions__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
