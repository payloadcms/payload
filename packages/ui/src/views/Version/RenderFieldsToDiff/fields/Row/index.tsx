'use client'
import type { RowFieldDiffClientComponent } from 'payload'

import React from 'react'

import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js'

const baseClass = 'row-diff'

export const Row: RowFieldDiffClientComponent = ({ baseVersionField }) => {
  return (
    <div className={baseClass}>
      <RenderVersionFieldsToDiff versionFields={baseVersionField.fields} />
    </div>
  )
}
