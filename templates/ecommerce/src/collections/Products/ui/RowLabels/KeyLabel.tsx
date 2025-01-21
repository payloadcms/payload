'use client'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import type { OptionKey } from '../types'

export const KeyLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<OptionKey>()
  const [label, setLabel] = useState(`Key ${rowNumber}`)

  useEffect(() => {
    if (data.label && data?.values?.length) {
      const title = `${data.label}`
      const values = data?.values?.map((option) => option.label) ?? []

      const label = `${title} (${values.join(', ')})`
      setLabel(label)
    } else {
      setLabel(`Key ${rowNumber}`)
    }
  }, [data, rowNumber])

  return (
    <div>
      <span>{label}</span>
    </div>
  )
}
