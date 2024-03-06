'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'

export const Heading5 = () => {
  const { attributes, children } = useElement()

  return <h5 {...attributes}>{children}</h5>
}
