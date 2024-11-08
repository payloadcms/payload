'use client'
import type { TextFieldClientComponent } from 'payload'

import React from 'react'

export const UICustomClient: TextFieldClientComponent = ({
  field: {
    name,
    admin: { custom },
  },
}) => {
  return <div id={name}>{custom?.customValue}</div>
}
