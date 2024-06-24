'use client'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import React from 'react'

export const UICustomClient: React.FC = () => {
  const { custom, path } = useFieldProps()

  return <div id={path}>{custom?.customValue}</div>
}
