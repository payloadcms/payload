import React from 'react'

import './index.css'

const baseClass = 'activity-status-pill'

export function StatusPill({
  isChanged = false,
  isDraft = false,
  label,
}: {
  isChanged?: boolean
  isDraft?: boolean
  label?: string
}) {
  if (!label) {
    return null
  }

  return (
    <span
      className={[baseClass, isDraft ? `${baseClass}--draft` : isChanged && `${baseClass}--changed`]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  )
}
