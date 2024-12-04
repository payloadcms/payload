'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

export const LabelComponent: React.FC = (props) => {
  console.log('props--> ', props)
  const key = useFormFields(([fields]) => fields.key)

  return <div>{(key?.value as string) ?? '<no value>'}yaya</div>
}
