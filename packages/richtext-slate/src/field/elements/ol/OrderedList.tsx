'use client'

import React from 'react'
import { useElement } from '../../providers/ElementProvider'
import './index.scss'

export const OrderedList: React.FC = () => {
  const { attributes, children } = useElement()

  return (
    <ol className="rich-text-ol" {...attributes}>
      {children}
    </ol>
  )
}
