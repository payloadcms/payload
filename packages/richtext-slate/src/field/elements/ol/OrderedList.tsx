'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'
import './index.scss'

export const OrderedListElement: React.FC = () => {
  const { attributes, children } = useElement()

  return (
    <ol className="rich-text-ol" {...attributes}>
      {children}
    </ol>
  )
}
