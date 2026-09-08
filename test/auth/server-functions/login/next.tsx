'use client'

import type { LoginArgs } from './index.js'

import { LoginForm } from './index.js'

const loginFunction = async (args: LoginArgs) => {
  const { loginFunction } = await import('./nextFunction.js')

  return loginFunction(args)
}

export function NextLoginForm({ dashboardURL }: { dashboardURL: string }) {
  return <LoginForm dashboardURL={dashboardURL} loginFunction={loginFunction} />
}
