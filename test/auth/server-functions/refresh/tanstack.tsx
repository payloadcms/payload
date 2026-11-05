'use client'

import { RefreshToken } from './index.js'

const refreshFunction = async () => {
  const { refreshFunction } = await import('./tanstackFunction.js')

  return refreshFunction()
}

export function TanStackRefreshToken() {
  return <RefreshToken refreshFunction={refreshFunction} />
}
