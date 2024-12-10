'use client'
import React from 'react'

import { ItalicIcon } from '../../icons/Italic/index.js'
import { LeafButton } from '../Button.js'

export const ItalicLeafButton = () => (
  <LeafButton format="italic">
    <ItalicIcon />
  </LeafButton>
)
