'use client'

import type { ReactNode } from 'react'

import { ErrorBoundary } from '@sentry/nextjs'

export const AdminErrorBoundary = ({ children }: { children: ReactNode }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
