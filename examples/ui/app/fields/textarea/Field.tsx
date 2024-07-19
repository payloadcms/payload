'use client'
import React from 'react'
import { TextareaInput } from '@payloadcms/ui/fields/Textarea'

export const CustomTextareaField: React.FC = () => {
  const [value, setValue] = React.useState('')

  return (
    <TextareaInput
      label="This is a label"
      descriptionProps={{ description: 'This is a description' }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
