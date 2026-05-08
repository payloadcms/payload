'use client'
import React, { useState } from 'react'

import { SelectInput } from './Input.js'

export const meta = {
  description: 'Dropdown select for choosing from a fixed set of options.',
  title: 'Fields / Select',
}

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
]

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
]

export const Default = () => {
  const [value, setValue] = useState<null | string>(null)
  return (
    <SelectInput
      label="Status"
      name="status"
      onChange={(selected) => setValue(selected ? (selected as { value: string }).value : null)}
      options={statusOptions}
      path="status"
      value={value}
    />
  )
}

export const WithValue = () => {
  const [value, setValue] = useState<null | string>('published')
  return (
    <SelectInput
      label="Status"
      name="status"
      onChange={(selected) => setValue(selected ? (selected as { value: string }).value : null)}
      options={statusOptions}
      path="status"
      value={value}
    />
  )
}

export const NotClearable = () => {
  const [value, setValue] = useState<null | string>('medium')
  return (
    <SelectInput
      isClearable={false}
      label="Priority"
      name="priority"
      onChange={(selected) => setValue(selected ? (selected as { value: string }).value : null)}
      options={priorityOptions}
      path="priority"
      value={value}
    />
  )
}

export const ReadOnly = () => (
  <SelectInput
    label="Category (read-only)"
    name="category"
    onChange={() => {}}
    options={statusOptions}
    path="category"
    readOnly
    value="published"
  />
)

export const WithError = () => {
  const [value, setValue] = useState<null | string>(null)
  return (
    <SelectInput
      label="Required selection"
      name="required"
      onChange={(selected) => setValue(selected ? (selected as { value: string }).value : null)}
      options={statusOptions}
      path="required"
      required
      showError
      value={value}
    />
  )
}

export const MultiSelect = () => {
  const [value, setValue] = useState<string[]>(['low', 'high'])
  return (
    <SelectInput
      hasMany
      label="Tags"
      name="tags"
      onChange={(selected) => {
        if (Array.isArray(selected)) {
          setValue(selected.map((opt: { value: string }) => opt.value))
        } else {
          setValue([])
        }
      }}
      options={priorityOptions}
      path="tags"
      value={value}
    />
  )
}
