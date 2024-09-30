import type { RowLabelComponent } from 'payload'
import type React from 'react'

export const getCustomLabel = ({
  fallback,
  path,
  style,
}: {
  fallback?: string
  path: string
  style: React.CSSProperties
}): RowLabelComponent => {
  return {
    clientProps: {
      fallback,
      path,
      style,
    },
    path: '/collections/Collapsible/CustomLabel/index.js#CustomLabelComponent',
  }
}
