import React from 'react'

import { Login } from '../../../components/Login/client.page'

type RouteParams = {
  tenant: string
}

export default function Page({ params }: { params: RouteParams }) {
  return <Login tenantSlug={params.tenant} />
}
