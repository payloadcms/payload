import React from 'react'

import type { AdminViewProps } from '../Root'

import { UnauthorizedClient } from './UnauthorizedClient'

export { generateUnauthorizedMetadata } from './meta'

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
