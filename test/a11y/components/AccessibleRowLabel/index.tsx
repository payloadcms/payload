'use client'

import { useRowLabel } from '@payloadcms/ui'

export function AccessibleRowLabel() {
  const { rowNumber } = useRowLabel()
  const label = `Featured item ${(rowNumber ?? 0) + 1}`

  return (
    <span className="row-label">
      {rowNumber === 0 ? (
        <img alt={label} src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" />
      ) : (
        <span aria-label={label} role="img">
          ★
        </span>
      )}
      <span aria-hidden="true">Decorative text</span>
    </span>
  )
}
