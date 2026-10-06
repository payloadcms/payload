'use client'

import type { ErrorInfo, ReactNode } from 'react'

import React, { createContext, Suspense, use } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { useTranslation } from '../../providers/Translation/index.js'
import { isControlFlowError } from './isControlFlowError.js'
import './index.css'

const ErrorFallbackContext = createContext<ReactNode | undefined>(undefined)

type Props = {
  children: ReactNode
  /** Import-map identity or config slot, used only for diagnostics and reset. */
  componentName: string
  /** A safe replacement, shared with the nearest nested boundary in this slot. */
  errorFallback?: ReactNode
  /** Change this when the document, row, or other component instance changes. */
  instanceKey?: number | string
}

/**
 * Isolates an injected subtree, including errors delivered through RSC payloads.
 * Suspense keeps streaming SSR failures within the slot until client recovery.
 * Event handlers and detached asynchronous work must handle their own errors.
 */
export function ConfigComponentErrorBoundary({
  children,
  componentName,
  errorFallback,
  instanceKey,
}: Props) {
  const inheritedFallback = use(ErrorFallbackContext)
  const selectedFallback = errorFallback === undefined ? inheritedFallback : errorFallback

  // Offer explicit fallbacks to the next boundary; deeper slots keep their own recovery.
  return (
    <ErrorFallbackContext value={errorFallback}>
      <ErrorBoundary
        fallbackRender={({ error }) => {
          if (isControlFlowError({ error })) {
            throw error
          }

          return selectedFallback === undefined ? (
            <ConfigComponentErrorFallback />
          ) : (
            selectedFallback
          )
        }}
        onError={(error, info: ErrorInfo) => {
          if (isControlFlowError({ error })) {
            return
          }

          // A provider boundary also catches descendants; identify the subtree, not the culprit.
          // eslint-disable-next-line no-console
          console.error(`Error rendering configured component subtree: ${componentName}`, {
            componentStack: info.componentStack,
            err: error,
            instanceKey,
          })
        }}
        resetKeys={[
          componentName,
          instanceKey,
          React.isValidElement(children) ? children.type : null,
        ]}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </ErrorBoundary>
    </ErrorFallbackContext>
  )
}

function ConfigComponentErrorFallback() {
  const { t } = useTranslation()

  // Inline markup remains valid in labels, table cells, and icon/action slots.
  return (
    <span className="config-component-error" role="alert">
      {t('error:unspecific')}
    </span>
  )
}
