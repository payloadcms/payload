'use client'
import React from 'react'

import { H6Icon } from '../../icons/headings/H6/index.js'
import { ElementButton } from '../Button.js'

export const H6ElementButton = ({ format }: { format: string }) => (
  <ElementButton format={format}>
    <H6Icon />
  </ElementButton>
)
