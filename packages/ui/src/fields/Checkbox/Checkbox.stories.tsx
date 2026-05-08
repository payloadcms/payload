'use client'
import React, { useState } from 'react'

import { CheckboxInput } from './Input.js'

export const meta = {
  description: 'Boolean toggle rendered as a styled checkbox.',
  title: 'Fields / Checkbox',
}

export const Unchecked = () => {
  const [checked, setChecked] = useState(false)
  return (
    <CheckboxInput
      checked={checked}
      label="Enable feature"
      name="enableFeature"
      onToggle={() => setChecked((prev) => !prev)}
    />
  )
}

export const Checked = () => {
  const [checked, setChecked] = useState(true)
  return (
    <CheckboxInput
      checked={checked}
      label="Enable feature"
      name="enableFeature"
      onToggle={() => setChecked((prev) => !prev)}
    />
  )
}

export const PartiallyChecked = () => {
  const [checked, setChecked] = useState(false)
  return (
    <CheckboxInput
      checked={checked}
      label="Select all"
      name="selectAll"
      onToggle={() => setChecked((prev) => !prev)}
      partialChecked
    />
  )
}

export const ReadOnly = () => (
  <CheckboxInput checked label="Read-only option" name="readOnly" onToggle={() => {}} readOnly />
)

export const Required = () => {
  const [checked, setChecked] = useState(false)
  return (
    <CheckboxInput
      checked={checked}
      label="I agree to the terms"
      name="agreeToTerms"
      onToggle={() => setChecked((prev) => !prev)}
      required
    />
  )
}
