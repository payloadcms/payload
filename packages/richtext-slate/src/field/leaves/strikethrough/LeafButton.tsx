'use client'
import React from 'react'

import { StrikethroughIcon } from '../../icons/Strikethrough/index.js'
import { LeafButton } from '../Button.js'

export const StrikethroughLeafButton = () => (
  <LeafButton format="strikethrough">
    <StrikethroughIcon />
  </LeafButton>
)
