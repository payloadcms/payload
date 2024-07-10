'use client'
import { useRowLabel } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import type { OptionKey } from '../types'

export const KeyLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<OptionKey>()
  const [label, setLabel] = useState(`Key ${rowNumber}`)

  useEffect(() => {
    if (data.label) {
      const title = `${data.label}`
      const options = data?.options?.map((option) => option.label) ?? []

      const label = `${title} (${options.join(', ')})`
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
