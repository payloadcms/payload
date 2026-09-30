'use client'
import type { RowFieldDiffClientProps } from 'payload'

import React from 'react'

import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js'

const baseClass = 'row-diff'

export const Row: React.FC<RowFieldDiffClientProps> = ({ baseVersionField }) => {
  return (
    <div className={baseClass}>
      <RenderVersionFieldsToDiff versionFields={baseVersionField.fields} />
    </div>
  )
}
