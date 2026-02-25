import type { AdminViewServerProps } from 'payload'

import React from 'react'

export const Image: React.FC<AdminViewServerProps> = async ({ payload }) => {
  const images = await payload.find({
    collection: 'uploads',
    limit: 1,
  })

  if (!images?.docs?.length) {
    return null
  }

  return (
    <div>
      <h2>This is an image:</h2>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img src={images?.docs?.[0]?.url as string} />
    </div>
  )
}
