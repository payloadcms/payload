'use client'
import type { RowFieldClient } from 'payload'

import React from 'react'

import type { DiffComponentProps } from '../../types.js'

import { RenderFieldsToDiff } from '../../index.js'

const baseClass = 'row-diff'

export const Row: React.FC<DiffComponentProps<RowFieldClient>> = ({ versionField }) => {
  return (
    <div className={baseClass}>
      <RenderFieldsToDiff fields={versionField.fields} />
    </div>
  )
}
