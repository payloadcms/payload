import React from 'react'

import type { Post } from '../../payload-types.js'

export const MyComponent: React.FC = () => {
  const test: Post = {
    id: 'string',
    createdAt: 'string',
    text: 'string',
    updatedAt: 'string',
  }

  console.log({ test })

  return <p>hi</p>
}
