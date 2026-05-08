'use client'
import React, { useState } from 'react'

export const meta = {
  description: 'Email address input with built-in format validation.',
  title: 'Fields / Email',
}

// EmailField uses useField() internally, so we use a direct input approach
// that mirrors the field's rendered output without requiring a Form context.

export const Default = () => {
  const [value, setValue] = useState('')
  return (
    <div className="field-type email">
      <label className="field-label" htmlFor="field-email">
        Email address
      </label>
      <div className="field-type__wrap">
        <input
          aria-label="Email address"
          className="form-input"
          id="field-email"
          name="email"
          onChange={(e) => setValue(e.target.value)}
          type="email"
          value={value}
        />
      </div>
    </div>
  )
}

export const WithValue = () => {
  const [value, setValue] = useState('hello@example.com')
  return (
    <div className="field-type email">
      <label className="field-label" htmlFor="field-contactEmail">
        Contact email
      </label>
      <div className="field-type__wrap">
        <input
          aria-label="Email address"
          className="form-input"
          id="field-contactEmail"
          name="contactEmail"
          onChange={(e) => setValue(e.target.value)}
          type="email"
          value={value}
        />
      </div>
    </div>
  )
}

export const ReadOnly = () => (
  <div className="field-type email read-only">
    <label className="field-label" htmlFor="field-email-readonly">
      Email (read-only)
    </label>
    <div className="field-type__wrap">
      <input
        aria-label="Email address"
        className="form-input"
        disabled
        id="field-email-readonly"
        name="emailReadOnly"
        onChange={() => {}}
        type="email"
        value="readonly@example.com"
      />
    </div>
  </div>
)

export const WithError = () => {
  const [value, setValue] = useState('')
  return (
    <div className="field-type email error">
      <label className="field-label" htmlFor="field-email-error">
        Email address <span className="required">*</span>
      </label>
      <div className="field-type__wrap">
        <div className="field-error">This field is required.</div>
        <input
          aria-label="Email address"
          className="form-input"
          id="field-email-error"
          name="emailError"
          onChange={(e) => setValue(e.target.value)}
          type="email"
          value={value}
        />
      </div>
    </div>
  )
}
