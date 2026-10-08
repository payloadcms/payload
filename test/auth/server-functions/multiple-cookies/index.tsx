'use client'

import { Banner, Button } from '@payloadcms/ui'
import { useState } from 'react'

type Props = {
  setMultipleCookies: () => Promise<unknown>
}

export const MultipleCookies = ({ setMultipleCookies }: Props) => {
  const [error, setError] = useState<null | string>(null)
  const [isPending, setIsPending] = useState(false)
  const [isSuccessful, setIsSuccessful] = useState(false)

  const handleSetMultipleCookies = async () => {
    setError(null)
    setIsPending(true)
    setIsSuccessful(false)

    try {
      await setMultipleCookies()
      setIsSuccessful(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Setting cookies failed')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div>
      <Button disabled={isPending} onClick={handleSetMultipleCookies}>
        Set multiple cookies
      </Button>
      {isSuccessful && (
        <div role="status">
          <Banner type="success">Cookies set</Banner>
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
