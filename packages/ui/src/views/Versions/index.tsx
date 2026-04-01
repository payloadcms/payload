import type { DocumentViewServerProps } from 'payload'
import type React from 'react'

/**
 * Stub - full implementation in RenderVersions.tsx (Task 9).
 * Throws 'not-found' to be caught by outer DocumentView error handler.
 */
export function VersionsView(_props: DocumentViewServerProps): React.ReactNode {
  throw new Error('not-found')
}
