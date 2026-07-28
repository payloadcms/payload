'use client'

import { LogoutButton } from './logout.js'

const logoutFunction = async () => {
  const { logoutFunction } = await import('./logoutFunction.js')

  return logoutFunction()
}

export function NextLogoutButton() {
  return <LogoutButton logoutFunction={logoutFunction} />
}
