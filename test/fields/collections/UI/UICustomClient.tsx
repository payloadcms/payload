'use client'
import type { TextFieldClientProps } from 'payload'

import React from 'react'

export const UICustomClient: React.FC<TextFieldClientProps> = ({
  field: {
    name,
    admin: { custom },
  },
}) => {
  return <div id={name}>{custom?.customValue}</div>
}
