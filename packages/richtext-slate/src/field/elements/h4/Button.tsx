'use client'
import React from 'react'

import { H4Icon } from '../../icons/headings/H4/index.js'
import { ElementButton } from '../Button.js'

export const H4ElementButton = ({ format }: { format: string }) => (
  <ElementButton format={format}>
    <H4Icon />
  </ElementButton>
)
