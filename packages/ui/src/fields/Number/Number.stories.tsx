'use client'
import React, { useState } from 'react'

import { InputStepper } from '../../elements/InputStepper/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'

export const meta = {
  description: 'Numeric input with increment/decrement stepper controls.',
  title: 'Fields / Number',
}

const baseClass = 'number'

export const Default = () => {
  const [value, setValue] = useState<number | string>('')
  return (
    <div className={[fieldBaseClass, baseClass].join(' ')}>
      <FieldLabel label="Quantity" path="quantity" />
      <div className={`${fieldBaseClass}__wrap`}>
        <div className="form-input-group">
          <input
            aria-label="Quantity"
            className="form-input"
            id="field-quantity"
            name="quantity"
            onChange={(e) => setValue(e.target.value)}
            step={1}
            type="number"
            value={value}
          />
          <InputStepper
            disabled={false}
            onDecrement={() => setValue((prev) => (prev === '' ? -1 : Number(prev) - 1))}
            onIncrement={() => setValue((prev) => (prev === '' ? 1 : Number(prev) + 1))}
          />
        </div>
      </div>
    </div>
  )
}

export const WithValue = () => {
  const [value, setValue] = useState<number | string>(29.99)
  return (
    <div className={[fieldBaseClass, baseClass].join(' ')}>
      <FieldLabel label="Price" path="price" />
      <div className={`${fieldBaseClass}__wrap`}>
        <div className="form-input-group">
          <input
            aria-label="Price"
            className="form-input"
            id="field-price"
            min={0}
            name="price"
            onChange={(e) => setValue(e.target.value)}
            step={0.01}
            type="number"
            value={value}
          />
          <InputStepper
            disabled={false}
            onDecrement={() => setValue((prev) => Math.max(0, Number(prev) - 0.01))}
            onIncrement={() => setValue((prev) => Number(prev) + 0.01)}
          />
        </div>
      </div>
    </div>
  )
}

export const WithMinMax = () => {
  const [value, setValue] = useState<number | string>(3)
  return (
    <div className={[fieldBaseClass, baseClass].join(' ')}>
      <FieldLabel label="Rating (1–5)" path="rating" />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldDescription description="Enter a value between 1 and 5." path="rating" />
        <div className="form-input-group">
          <input
            aria-label="Rating (1–5)"
            className="form-input"
            id="field-rating"
            max={5}
            min={1}
            name="rating"
            onChange={(e) => setValue(e.target.value)}
            step={1}
            type="number"
            value={value}
          />
          <InputStepper
            disabled={false}
            onDecrement={() => setValue((prev) => Math.max(1, Number(prev) - 1))}
            onIncrement={() => setValue((prev) => Math.min(5, Number(prev) + 1))}
          />
        </div>
      </div>
    </div>
  )
}

export const ReadOnly = () => (
  <div className={[fieldBaseClass, baseClass, 'read-only'].join(' ')}>
    <FieldLabel label="View count" path="viewCount" />
    <div className={`${fieldBaseClass}__wrap`}>
      <div className="form-input-group">
        <input
          aria-label="View count"
          className="form-input"
          disabled
          id="field-viewCount"
          name="viewCount"
          onChange={() => {}}
          type="number"
          value={1042}
        />
        <InputStepper disabled onDecrement={() => {}} onIncrement={() => {}} />
      </div>
    </div>
  </div>
)
