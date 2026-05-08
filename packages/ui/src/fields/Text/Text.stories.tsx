'use client'
import React, { useState } from 'react'

import { TextInput } from './Input.js'

export const meta = {
  description: 'Single-line text input for short string values.',
  title: 'Fields / Text',
}

export const Default = () => {
  const [value, setValue] = useState('')
  return (
    <TextInput
      label="Title"
      onChange={(e) => setValue(e.target.value)}
      path="title"
      value={value}
    />
  )
}

export const WithValue = () => {
  const [value, setValue] = useState('my-document-slug')
  return (
    <TextInput label="Slug" onChange={(e) => setValue(e.target.value)} path="slug" value={value} />
  )
}

export const WithPlaceholder = () => {
  const [value, setValue] = useState('')
  return (
    <TextInput
      label="Email address"
      onChange={(e) => setValue(e.target.value)}
      path="email"
      placeholder="e.g. hello@example.com"
      value={value}
    />
  )
}

export const ReadOnly = () => (
  <TextInput
    label="Read-only field"
    onChange={() => {}}
    path="readOnly"
    readOnly
    value="Cannot edit this"
  />
)

export const WithError = () => {
  const [value, setValue] = useState('')
  return (
    <TextInput
      label="Required field"
      onChange={(e) => setValue(e.target.value)}
      path="required"
      showError
      value={value}
    />
  )
}

export const Required = () => {
  const [value, setValue] = useState('')
  return (
    <TextInput
      label="Document title"
      onChange={(e) => setValue(e.target.value)}
      path="title"
      required
      value={value}
    />
  )
}
