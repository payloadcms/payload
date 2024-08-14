'use client'
import React from 'react'

import { H5Icon } from '../../icons/headings/H5/index.js'
import { ElementButton } from '../Button.js'

export const H5ElementButton = ({ format }: { format: string }) => (
  <ElementButton format={format}>
    <H5Icon />
  </ElementButton>
)
