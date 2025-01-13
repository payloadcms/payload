import React from 'react'

import { Login } from '../../../../components/Login/client.page'

type RouteParams = {
  tenant: string
}

// eslint-disable-next-line no-restricted-exports
export default async function Page({ params: paramsPromise }: { params: Promise<RouteParams> }) {
  const params = await paramsPromise

  return <Login tenantSlug={params.tenant} />
}
