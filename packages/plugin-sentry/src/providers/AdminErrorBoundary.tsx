'use client'

import type { ReactNode } from 'react'

import { ErrorBoundary } from '@sentry/nextjs'

/**
 * Captures errored components to Sentry
 */
export const AdminErrorBoundary = ({ children }: { children: ReactNode }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
