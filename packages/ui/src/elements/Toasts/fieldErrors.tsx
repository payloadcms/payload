'use client'

import React from 'react'

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

function createErrorsFromMessage(message: string): {
  errors?: string[]
  message: string
} {
  const [intro, errorsString] = message.split(':')

  if (!errorsString) {
    return {
      message: intro,
    }
  }

  const errors = errorsString.split(',').map((error) => error.replaceAll(' > ', ' → ').trim())

  if (errors.length === 1) {
    return {
      errors,
      message: `${intro}:`,
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
    <div>
      {message}
      {Array.isArray(errors) && errors.length > 0 ? (
        <ul data-testid="field-errors">
          {errors.map((error, index) => {
            return <li key={index}>{error}</li>
          })}
        </ul>
      ) : null}
    </div>
  )
}
