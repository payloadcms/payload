'use client'
import React from 'react'

import { H1Icon } from '../../icons/headings/H1/index.js'
import { ElementButton } from '../Button.js'

export const H1ElementButton = ({ format }: { format: string }) => (
  <ElementButton format={format}>
    <H1Icon />
  </ElementButton>
)
