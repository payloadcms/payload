'use client'
import React from 'react'

import { BlockquoteIcon } from '../../icons/Blockquote/index.js'
import { ElementButton } from '../Button.js'

export const BlockquoteElementButton = ({ format }: { format: string }) => (
  <ElementButton format={format}>
    <BlockquoteIcon />
  </ElementButton>
)
