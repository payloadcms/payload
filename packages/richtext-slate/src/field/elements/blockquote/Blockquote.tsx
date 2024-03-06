'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'
import './index.scss'

export const Blockquote = () => {
  const { attributes, children } = useElement()

  return (
    <blockquote className="rich-text-blockquote" {...attributes}>
      {children}
    </blockquote>
  )
}
