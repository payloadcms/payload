'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'
import './index.scss'

export const UnorderedListElement: React.FC = () => {
  const { attributes, children } = useElement()

  return (
    <ul className="rich-text-ul" {...attributes}>
      {children}
    </ul>
  )
}
