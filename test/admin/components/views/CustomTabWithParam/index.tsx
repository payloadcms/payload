import type { DocumentViewServerProps } from 'payload'

import React from 'react'

import { customParamViewTitle } from '../../../shared.js'

export function CustomTabWithParamView({ params }: DocumentViewServerProps) {
  const paramValue = params?.segments?.[4]

  return (
    <div
      style={{
        marginTop: 'calc(var(--base) * 2)',
        paddingLeft: 'var(--gutter-h)',
        paddingRight: 'var(--gutter-h)',
      }}
    >
      <h1 id="custom-view-title">{customParamViewTitle}</h1>
      <p>
        This custom collection view is using a dynamic URL parameter `slug: {paramValue || 'None'}`
      </p>
    </div>
  )
}
