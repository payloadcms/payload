'use client'

import type { LoginArgs } from './index.js'

import { LoginForm } from './index.js'

const loginFunction = async (args: LoginArgs) => {
  const { loginFunction } = await import('./tanstackFunction.js')

  return loginFunction(args)
}

export function TanStackLoginForm({ dashboardURL }: { dashboardURL: string }) {
  return <LoginForm dashboardURL={dashboardURL} loginFunction={loginFunction} />
}
