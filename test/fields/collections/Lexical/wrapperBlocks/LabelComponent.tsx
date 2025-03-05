'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

export const NameLabelComponent: React.FC = () => {
  const name = useFormFields(([fields]) => fields.name)

  return <div>{(name?.value as string) ? 'Name: ' + (name?.value as string) : '<no name>'}</div>
}
