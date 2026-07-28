'use client'

import { Banner, Button } from '@payloadcms/ui'
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
    <div>
      <Button disabled={isPending} onClick={handleRefresh}>
        Custom Refresh
      </Button>
      {isSuccessful && (
        <div role="status">
          <Banner type="success">Token refreshed</Banner>
        </div>
      )}
      {error && (
        <div role="alert">
          <Banner type="danger">{error}</Banner>
        </div>
      )}
    </div>
  )
}
