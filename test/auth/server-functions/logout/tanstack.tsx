'use client'

import { LogoutButton } from './index.js'

const logoutFunction = async () => {
  const { logoutFunction } = await import('./tanstackFunction.js')

  return logoutFunction()
}

export function TanStackLogoutButton() {
  return <LogoutButton logoutFunction={logoutFunction} />
}
