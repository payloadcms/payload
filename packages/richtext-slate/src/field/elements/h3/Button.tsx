'use client'
import React from 'react'

import { H3Icon } from '../../icons/headings/H3/index.js'
import { ElementButton } from '../Button.js'

export const H3ElementButton = ({ format }: { format: string }) => (
  <ElementButton format={format}>
    <H3Icon />
  </ElementButton>
)
