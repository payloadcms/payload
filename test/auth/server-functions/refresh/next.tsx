'use client'

import { RefreshToken } from './index.js'

const refreshFunction = async () => {
  const { refreshFunction } = await import('./nextFunction.js')

  return refreshFunction()
}

export function NextRefreshToken() {
  return <RefreshToken refreshFunction={refreshFunction} />
}
