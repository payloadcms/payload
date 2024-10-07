'use client'
import type { TextFieldClientComponent } from 'payload'

import React from 'react'

export const UICustomClient: TextFieldClientComponent = ({
  field: {
    _path: path,
    admin: { custom },
  },
}) => {
  return <div id={path}>{custom?.customValue}</div>
}
