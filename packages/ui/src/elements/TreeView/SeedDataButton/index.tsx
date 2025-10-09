'use client'

import React from 'react'
import { toast } from 'sonner'

import { useConfig } from '../../../providers/Config/index.js'
import { Button } from '../../Button/index.js'

type SeedDataButtonProps = {
  collectionSlug: string
}

export function SeedDataButton({ collectionSlug }: SeedDataButtonProps) {
  const { config } = useConfig()
  const { routes, serverURL } = config
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSeedData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${serverURL}${routes.api}/${collectionSlug}/seed-data`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new Error('Failed to seed data')
      }

      const result = await response.json()
      toast.success(result.message || 'Seed data created successfully')

      // Reload the page to show the new data
      window.location.reload()
    } catch (error) {
      console.error('Error seeding data:', error)
      toast.error('Failed to seed data')
    } finally {
      setIsLoading(false)
    }
  }, [serverURL, routes.api, collectionSlug])

  return (
    <Button
      buttonStyle="secondary"
      disabled={isLoading}
      onClick={handleSeedData}
      size="small"
    >
      {isLoading ? 'Seeding...' : 'Seed Test Data'}
    </Button>
  )
}
