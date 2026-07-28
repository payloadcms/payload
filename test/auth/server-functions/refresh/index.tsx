'use client'

import { useState } from 'react'

type Props = {
  refreshFunction: () => Promise<unknown>
}

export const RefreshToken = ({ refreshFunction }: Props) => {
  const [error, setError] = useState<null | string>(null)
  const [isPending, setIsPending] = useState(false)
  const [isSuccessful, setIsSuccessful] = useState(false)

  const handleRefresh = async () => {
    setError(null)
    setIsPending(true)
    setIsSuccessful(false)

    try {
      await refreshFunction()
      setIsSuccessful(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Refresh failed')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="auth-server-functions__action">
      <button disabled={isPending} onClick={handleRefresh} type="button">
        Custom Refresh
      </button>
      {isSuccessful && (
        <p className="auth-server-functions__success" role="status">
          Token refreshed
        </p>
      )}
      {error && (
        <p className="auth-server-functions__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
