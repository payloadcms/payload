'use client'

import type { ReactNode } from 'react'

import { FormErrorHandlerContext } from '@payloadcms/ui'
import { useCallback, useState } from 'react'

export function APIErrorHandler({ children }: { children: ReactNode }) {
  const [handledError, setHandledError] = useState<{
    data: unknown
    message: string
    retry: () => void
  }>()

  const handleError = useCallback(
    (error: { data?: unknown; message: string }, retry: () => void) => {
      if (
        !error.data ||
        typeof error.data !== 'object' ||
        !('code' in error.data) ||
        error.data.code !== 'parser-test'
      ) {
        return false
      }

      setHandledError({ data: error.data, message: error.message, retry })

      return true
    },
    [],
  )

  return (
    <FormErrorHandlerContext value={handleError}>
      {children}
      {handledError && (
        <section aria-label="Handled API error">
          <p aria-label="Handled error message" role="status">
            {handledError.message}
          </p>
          <output aria-label="Handled error metadata">{JSON.stringify(handledError.data)}</output>
          <button
            onClick={() => {
              setHandledError(undefined)
              handledError.retry()
            }}
            type="button"
          >
            Retry save
          </button>
        </section>
      )}
    </FormErrorHandlerContext>
  )
}
