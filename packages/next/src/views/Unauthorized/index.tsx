import React from 'react'

import type { AdminViewProps } from '../Root/index.js'

import { UnauthorizedClient } from './UnauthorizedClient.js'

export { generateUnauthorizedMetadata } from './meta.js'

export const Unauthorized: React.FC<AdminViewProps> = ({ initPageResult }) => {
  const {
    req: {
      payload: {
        config: {
          admin: { logoutRoute },
          routes: { admin },
        },
      },
    },
  } = initPageResult

  return <UnauthorizedClient logoutRoute={`${admin}${logoutRoute}`} />
}
