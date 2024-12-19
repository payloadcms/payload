'use client'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import type { InfoType } from '../types'

type RowData = {
  id: string
  info: InfoType
  options: string[]
  stock: number
  stripeProductID: string
}

export const VariantLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<RowData>()
  const [label, setLabel] = useState(`Variant ${rowNumber}`)

  useEffect(() => {
    if (data?.info) {
      const info = data.info

      const labels: string[] = []

      info.options.forEach((option) => {
        if (option.label) labels.push(option.label)
      })

      setLabel(labels.join(' '))
    } else {
      setLabel(`Variant ${rowNumber}`)
    }
  }, [data, rowNumber])

  return (
    <div>
      <span>{label}</span>
    </div>
  )
}
