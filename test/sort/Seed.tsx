/* eslint-disable no-console */
'use client'

export const Seed = () => {
  return (
    <button
      onClick={async () => {
        try {
          await fetch('/api/seed', { method: 'POST' })
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
