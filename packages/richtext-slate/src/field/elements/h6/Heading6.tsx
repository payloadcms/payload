'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'

export const Heading6Element = () => {
  const { attributes, children } = useElement()

  return <h6 {...attributes}>{children}</h6>
}
