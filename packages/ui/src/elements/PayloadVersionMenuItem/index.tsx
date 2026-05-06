import type { ServerProps } from 'payload'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { PayloadVersionModalTrigger } from '../../exports/client/index.js'

export const PayloadVersionMenuItem: React.FC<ServerProps> = ({ payload }) => {
  const versions = payload?.config?.admin?.packageVersions ?? { payload: '0.0.0' }
  return <PayloadVersionModalTrigger versions={versions} />
}
