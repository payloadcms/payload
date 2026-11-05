import type { AdminViewServerProps } from 'payload'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { NotFoundClient } from '../../exports/client/index.js'

export { NotFoundClient }

export function NotFoundView(_props: AdminViewServerProps) {
  return <NotFoundClient />
}
