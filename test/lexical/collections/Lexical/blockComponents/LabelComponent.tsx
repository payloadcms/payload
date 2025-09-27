'use client'

import type { UIFieldClientComponent } from 'payload'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

export const LabelComponent: UIFieldClientComponent = () => {
  const key = useFormFields(([fields]) => fields.key)

  return <div>{(key?.value as string) ?? '<no value>'}yaya</div>
}
