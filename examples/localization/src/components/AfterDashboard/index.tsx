'use client'

import React, { Fragment, useCallback, useState } from 'react'
import { toast } from '@payloadcms/ui'

const SuccessMessage: React.FC = () => (
  <div>
    Database seeded! You can now{' '}
    <a target="_blank" href="/">
      visit your website
    </a>
  </div>
)

export const SeedButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [error, setError] = useState(null)

  const handleClick = useCallback(
    async (e) => {
      e.preventDefault()
      if (loading || seeded) return

      setLoading(true)

      try {
        await fetch('/api/seed')
        setSeeded(true)
        toast.success(<SuccessMessage />, { duration: 5000 })
      } catch (err) {
        setError(err)
      }
    },
    [loading, seeded],
  )

  let message = ''
  if (loading) message = ' (seeding...)'
  if (seeded) message = ' (done!)'
  if (error) message = ` (error: ${error})`

  return (
    <Fragment>
      <a href="/api/seed" onClick={handleClick} rel="noopener noreferrer" target="_blank">
        Reset / seed database
      </a>
      {message}
    </Fragment>
  )
}

export default SeedButton
