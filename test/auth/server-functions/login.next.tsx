'use client'

import type { LoginArgs } from './login.js'

import { LoginForm } from './login.js'

const loginFunction = async (args: LoginArgs) => {
  const { loginFunction } = await import('./loginFunction.js')

  return loginFunction(args)
}

export function NextLoginForm() {
  return <LoginForm loginFunction={loginFunction} />
}
