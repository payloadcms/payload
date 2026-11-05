'use client'

import { LogoutButton } from './index.js'

const logoutFunction = async () => {
  const { logoutFunction } = await import('./tanstackFunction.js')

  return logoutFunction()
}

export function TanStackLogoutButton({ loginURL }: { loginURL: string }) {
  return <LogoutButton loginURL={loginURL} logoutFunction={logoutFunction} />
}
