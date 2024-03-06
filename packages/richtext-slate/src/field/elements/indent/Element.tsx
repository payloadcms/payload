'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'

export const IndentElement: React.FC = () => {
  const { attributes, children } = useElement()

  return (
    <div style={{ paddingLeft: 25 }} {...attributes}>
      {children}
    </div>
  )
}
