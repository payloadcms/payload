'use client'

import { RefreshToken } from './refresh.js'

const refreshFunction = async () => {
  const { refreshFunction } = await import('./refreshFunction.js')

  return refreshFunction()
}

export function NextRefreshToken() {
  return <RefreshToken refreshFunction={refreshFunction} />
}
