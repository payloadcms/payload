'use client'

import type React from 'react'

export const EmbedComponent: React.FC<any> = (props) => {
  const { data } = props

  return <span>{data.key}</span>
}
