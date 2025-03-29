'use client'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

export const OptionLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<{ label: string }>()
  const [label, setLabel] = useState(`Option ${rowNumber}`)

  useEffect(() => {
    if (data?.label) {
      setLabel(data.label)
    } else {
      setLabel(`Option ${rowNumber}`)
    }
  }, [data, rowNumber])

  return (
    <div>
      <span>{label}</span>
    </div>
  )
}
