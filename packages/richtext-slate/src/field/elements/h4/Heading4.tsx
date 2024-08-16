'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'
import { Heading2Element } from '../h2/Heading2.js'

export const Heading4Element = () => {
  const { attributes, children } = useElement()

  return <h4 {...attributes}>{children}</h4>
}
