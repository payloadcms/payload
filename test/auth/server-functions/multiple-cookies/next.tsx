'use client'

import { MultipleCookies } from './index.js'

const setMultipleCookies = async () => {
  const { setMultipleCookiesFunction } = await import('./nextFunction.js')

  return setMultipleCookiesFunction()
}

export function NextMultipleCookies() {
  return <MultipleCookies setMultipleCookies={setMultipleCookies} />
}
