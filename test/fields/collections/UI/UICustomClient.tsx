'use client'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import React from 'react'

export const UICustomClient: React.FC = () => {
  const { custom, path } = useFieldProps()
  const client = custom?.client

  return <div id={path}>{client?.customValue}</div>
}
