'use client'

import { MultipleCookies } from './index.js'

const setMultipleCookies = async () => {
  const { setMultipleCookiesFunction } = await import('./tanstackFunction.js')

  return setMultipleCookiesFunction()
}

export function TanStackMultipleCookies() {
  return <MultipleCookies setMultipleCookies={setMultipleCookies} />
}
