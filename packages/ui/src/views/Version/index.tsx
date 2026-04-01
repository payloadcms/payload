import type { DocumentViewServerProps } from 'payload'
import type React from 'react'

/**
 * Stub - full implementation in RenderVersion.tsx (Task 9).
 * Throws 'not-found' to be caught by outer DocumentView error handler.
 */
export function VersionView(_props: DocumentViewServerProps): React.ReactNode {
  throw new Error('not-found')
}
