'use client'

import { RefreshToken } from './refresh.js'

const refreshFunction = async () => {
  const { refreshFunction } = await import('./tanstackFunctions.js')

  return refreshFunction()
}

export function TanStackRefreshToken() {
  return <RefreshToken refreshFunction={refreshFunction} />
}
