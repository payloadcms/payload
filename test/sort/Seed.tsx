/* eslint-disable no-console */
'use client'
import { useRouter } from '@payloadcms/ui'

export const Seed = () => {
  const router = useRouter()

  return (
    <button
      onClick={async () => {
        try {
          await fetch('/api/seed', { method: 'POST' })
          router.refresh()
        } catch (error) {
          console.error(error)
        }
      }}
      type="button"
    >
      Seed
    </button>
  )
}
