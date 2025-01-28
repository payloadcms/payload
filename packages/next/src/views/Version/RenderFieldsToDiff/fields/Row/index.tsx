'use client'
import type { DiffComponentProps, RowFieldClient } from 'payload'

import React from 'react'

import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js'

const baseClass = 'row-diff'

export const Row: React.FC<DiffComponentProps<RowFieldClient>> = ({ baseVersionField }) => {
  return (
    <div className={baseClass}>
      <RenderVersionFieldsToDiff versionFields={baseVersionField.fields} />
    </div>
  )
}
