'use client'

import React from 'react'

function groupSimilarPaths(items: string[]): string[] {
  const result: string[] = []

  for (const item of items) {
    const parts = item.split(' > ')
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

  return result
}

export function FieldErrorsToast({ errors, t }) {
  const [groupedErrors] = React.useState(() => groupSimilarPaths(errors))

  return (
    <div>
      {t('error:followingFieldsInvalid', { count: errors.length }).replace(
        ':',
        ` (${errors.length}):`,
      )}
      <ul>
        {groupedErrors.map((error, index) => {
          return <li key={index}>{error.replaceAll(' > ', ' → ')}</li>
        })}
      </ul>
    </div>
  )
}
