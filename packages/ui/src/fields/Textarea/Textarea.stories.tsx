'use client'
import React, { useState } from 'react'

import { TextareaInput } from './Input.js'

export const meta = {
  description: 'Multi-line text input for longer string values.',
  title: 'Fields / Textarea',
}

export const Default = () => {
  const [value, setValue] = useState('')
  return (
    <TextareaInput
      label="Description"
      onChange={(e) => setValue(e.target.value)}
      path="description"
      value={value}
    />
  )
}

export const WithValue = () => {
  const [value, setValue] = useState(
    'This is some longer content that spans multiple lines and describes the document in detail.',
  )
  return (
    <TextareaInput
      label="Body"
      onChange={(e) => setValue(e.target.value)}
      path="body"
      value={value}
    />
  )
}

export const WithPlaceholder = () => {
  const [value, setValue] = useState('')
  return (
    <TextareaInput
      label="Summary"
      onChange={(e) => setValue(e.target.value)}
      path="summary"
      placeholder="Enter a brief summary..."
      value={value}
    />
  )
}

export const WithCustomRows = () => {
  const [value, setValue] = useState('')
  return (
    <TextareaInput
      label="Notes (8 rows)"
      onChange={(e) => setValue(e.target.value)}
      path="notes"
      rows={8}
      value={value}
    />
  )
}

export const ReadOnly = () => (
  <TextareaInput
    label="Read-only content"
    onChange={() => {}}
    path="readOnly"
    readOnly
    value="This content cannot be edited by the user."
  />
)

export const Required = () => {
  const [value, setValue] = useState('')
  return (
    <TextareaInput
      label="Required notes"
      onChange={(e) => setValue(e.target.value)}
      path="notes"
      required
      value={value}
    />
  )
}
