'use client'
import { ProductVariant } from '@/collections/Products/ui/types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

export const VariantLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<ProductVariant>()
  const [label, setLabel] = useState(`Variant ${rowNumber}`)

  useEffect(() => {
    if (data?.options?.length) {
      const labels: string[] = []

      data?.options.forEach((option) => {
        if (option) labels.push(option.label)
      })

      setLabel(labels.join(' '))
    } else {
      setLabel(`Variant ${rowNumber}`)
    }
  }, [data, rowNumber])

  return (
    <div>
      <span style={{ textTransform: 'capitalize' }}>{label}</span>
    </div>
  )
}
