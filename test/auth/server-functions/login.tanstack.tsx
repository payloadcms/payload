'use client'

import type { LoginArgs } from './login.js'

import { LoginForm } from './login.js'

const loginFunction = async (args: LoginArgs) => {
  const { loginFunction } = await import('./tanstackFunctions.js')

  return loginFunction(args)
}

export function TanStackLoginForm() {
  return <LoginForm loginFunction={loginFunction} />
}
