'use client'
import React from 'react'
import { TextInput } from '@payloadcms/ui/fields/Text'

export const CustomTextField: React.FC = () => {
  const [value, setValue] = React.useState('')

  return (
    <TextInput
      label="This is a label"
      descriptionProps={{ description: 'This is a description' }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
