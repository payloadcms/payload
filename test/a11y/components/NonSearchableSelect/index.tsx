'use client'

import { ReactSelect } from '@payloadcms/ui'
import React, { useState } from 'react'

export const NonSearchableSelect = () => {
  const [hasError, setHasError] = useState(true)

  return (
    <div>
      <ReactSelect
        aria-describedby={hasError ? 'non-searchable-error' : undefined}
        aria-invalid={hasError || undefined}
        aria-label="Non-searchable required select"
        aria-required={hasError || undefined}
        isSearchable={false}
        options={[{ label: 'One', value: 'one' }]}
        placeholder="Choose an option"
      />
      {hasError && <p id="non-searchable-error">An option is required.</p>}
      <button onClick={() => setHasError(false)} type="button">
        Clear select requirements
      </button>
    </div>
  )
}
