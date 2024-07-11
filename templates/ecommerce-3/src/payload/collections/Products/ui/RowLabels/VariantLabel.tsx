'use client'
import { useRowLabel } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import type { InfoType } from '../types'

type RowData = {
  id: string
  info: InfoType
  options: string[]
  stock: number
  stripeProductID: string
}

export const VariantLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<RowData>()
  const [label, setLabel] = useState(`Variant ${rowNumber}`)

  useEffect(() => {
    if (data?.info) {
      const info = data.info

      const labels = []

      info.options.forEach((option) => {
        labels.push(option.label)
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
