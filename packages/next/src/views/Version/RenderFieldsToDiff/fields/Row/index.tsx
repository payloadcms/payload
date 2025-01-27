'use client'
import type { DiffComponentProps, RowFieldClient } from 'payload'

import React from 'react'

import { RenderFieldsToDiff } from '../../index.js'

const baseClass = 'row-diff'

export const Row: React.FC<DiffComponentProps<RowFieldClient>> = ({ baseVersionField }) => {
  return (
    <div className={baseClass}>
      <RenderFieldsToDiff fields={baseVersionField.fields} />
    </div>
  )
}
