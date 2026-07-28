'use client'

import { type ChangeEvent, useState } from 'react'

export type LoginArgs = {
  email: string
  password: string
}

type Props = {
  dashboardURL: string
  loginFunction: (args: LoginArgs) => Promise<unknown>
}

export const LoginForm = ({ dashboardURL, loginFunction }: Props) => {
  const [email, setEmail] = useState<string>('')
  const [error, setError] = useState<null | string>(null)
  const [isPending, setIsPending] = useState(false)
  const [password, setPassword] = useState<string>('')

  const handleLogin = async () => {
    setError(null)
    setIsPending(true)

    try {
      await loginFunction({ email, password })
      window.location.assign(dashboardURL)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed')
      setIsPending(false)
    }
  }

  return (
    <div className="auth-server-functions__login">
      <div className="auth-server-functions__field">
        <label htmlFor="server-function-email">Email</label>
        <input
          aria-label="Server function email"
          id="server-function-email"
          onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
          placeholder="Email"
          required
          type="email"
          value={email}
        />
      </div>
      <div className="auth-server-functions__field">
        <label htmlFor="server-function-password">Password</label>
        <input
          aria-label="Server function password"
          id="server-function-password"
          onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />
      </div>
      {error && (
        <p className="auth-server-functions__error" role="alert">
          {error}
        </p>
      )}
      <button disabled={isPending} onClick={handleLogin} type="button">
        Custom Login
      </button>
    </div>
  )
}
