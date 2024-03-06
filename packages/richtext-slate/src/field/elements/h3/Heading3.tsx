'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'

export const Heading3 = () => {
  const { attributes, children } = useElement()

  return <h3 {...attributes}>{children}</h3>
}
