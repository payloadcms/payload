'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

export const ColorLabelComponent: React.FC = () => {
  const color = useFormFields(([fields]) => fields.color)

  return (
    <div>
      {(color?.value as string) ? (
        <>
          <span>Color: </span>
          <span style={{ color: (color?.value as string) ?? undefined, fontWeight: 'bold' }}>
            {color?.value as string}
          </span>
        </>
      ) : (
        'No color'
      )}
    </div>
  )
}
