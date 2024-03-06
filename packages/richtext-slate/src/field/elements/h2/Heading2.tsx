'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'

export const Heading2 = () => {
  const { attributes, children } = useElement()

  return <h2 {...attributes}>{children}</h2>
}
