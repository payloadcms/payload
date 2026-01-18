'use client'

import type { NumberFieldClientComponent } from '@ruya.sa/payload'

import { NumberField, useField } from '@ruya.sa/ui'
import React, { useEffect } from 'react'

import './index.scss'

const baseClass = 'page-field'

export const Page: NumberFieldClientComponent = (props) => {
  const { setValue } = useField<number>()
  const { value: limitValue } = useField<number>({ path: 'limit' })

  // Effect to reset page to 1 if limit is removed
  useEffect(() => {
    if (!limitValue) {
      setValue(1) // Reset page to 1
    }
  }, [limitValue, setValue])

  return (
    <div className={baseClass}>
      <NumberField
        field={{
          name: props.field.name,
          admin: {
            autoComplete: undefined,
            placeholder: undefined,
            step: 1,
          },
          label: props.field.label,
          min: 1,
        }}
        onChange={(value) => setValue(value ?? 1)} // Update the page value on change
        path={props.path}
      />
    </div>
  )
}
