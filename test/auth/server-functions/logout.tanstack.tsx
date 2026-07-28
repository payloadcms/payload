'use client'

import { LogoutButton } from './logout.js'

const logoutFunction = async () => {
  const { logoutFunction } = await import('./tanstackFunctions.js')

  return logoutFunction()
}

export function TanStackLogoutButton() {
  return <LogoutButton logoutFunction={logoutFunction} />
}
