'use client'

import React from 'react'

import { WarningIcon } from '../../icons/Warning/index.js'
import './index.css'

function groupSimilarErrors(items: string[]): string[] {
  const result: string[] = []

  for (const item of items) {
    if (item) {
      const parts = item.split(' → ')
      let inserted = false

      // Find a place where a similar path exists
      for (let i = 0; i < result.length; i++) {
        if (result[i].startsWith(parts[0])) {
          result.splice(i + 1, 0, item)
          inserted = true
          break
        }
      }

      // If no similar path was found, add to the end
      if (!inserted) {
        result.push(item)
      }
    }
  }

  return result
}

export function createErrorsFromMessage(message: string): {
  errors?: string[]
  message: string
} {
  const colonIndex = message.indexOf(':')
  const intro = colonIndex >= 0 ? message.slice(0, colonIndex) : message
  const errorsString = colonIndex >= 0 ? message.slice(colonIndex + 1) : undefined

  if (!errorsString) {
    return {
      message: intro,
    }
  }

  const errors = errorsString.split(',').map((error) => error.replaceAll(' > ', ' → ').trim())

  if (errors.length === 1) {
    return {
      errors,
      message: `${intro}: `,
    }
  }

  return {
    errors: groupSimilarErrors(errors),
    message: `${intro} (${errors.length}):`,
  }
}

export function FieldErrorsToast({ errorMessage }) {
  const [{ errors, message }] = React.useState(() => createErrorsFromMessage(errorMessage))

  return (
    <>
      <div className="toast-icon">
        <WarningIcon size={24} />
      </div>
      <div className="toast-content" data-testid="field-errors-toast">
        <div className="toast-title">
          {message}
          {Array.isArray(errors) && errors.length > 0 ? (
            errors.length === 1 ? (
              <span className="field-error" data-testid="field-error">
                {errors[0]}
              </span>
            ) : (
              <ul className="field-errors" data-testid="field-errors">
                {errors.map((error, index) => {
                  return <li key={index}>{error}</li>
                })}
              </ul>
            )
          ) : null}
        </div>
      </div>
    </>
  )
}
