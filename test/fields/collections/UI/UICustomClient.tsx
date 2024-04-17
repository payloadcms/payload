'use client'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import React from 'react'

export const UICustomClient: React.FC = () => {
  const { customClient, path } = useFieldProps()

  return <div id={path}>{customClient?.customValue}</div>
}
