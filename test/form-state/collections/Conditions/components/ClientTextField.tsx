'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

export const ClientTextField: TextFieldClientComponent = (props) => {
  const [renderedAt, setRenderedAt] = useState<string>('')

  useEffect(() => {
    setRenderedAt(new Date().toISOString())
  }, [])

  return (
    <div data-rendered-at={renderedAt} id="custom-client-text-field">
      <p suppressHydrationWarning>
        {renderedAt ? `custom client component rendered at ${renderedAt}.` : ''}
      </p>
      <TextField {...props} />
    </div>
  )
}
