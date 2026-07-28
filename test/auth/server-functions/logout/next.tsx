'use client'

import { LogoutButton } from './index.js'

const logoutFunction = async () => {
  const { logoutFunction } = await import('./nextFunction.js')

  return logoutFunction()
}

export function NextLogoutButton({ loginURL }: { loginURL: string }) {
  return <LogoutButton loginURL={loginURL} logoutFunction={logoutFunction} />
}
