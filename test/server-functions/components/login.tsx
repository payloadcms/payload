'use client'
import type { ChangeEvent, FormEvent } from 'react'

import { login } from '@payloadcms/next/server-functions'
import { useState } from 'react'

const LoginForm = () => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<null | string>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const response = await login({ collection: 'users', email, password })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        placeholder="Email"
        required
        type="email"
        value={email}
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        placeholder="Password"
        required
        type="password"
        value={password}
      />
      <button type="submit">Custom Login</button>
      {error && <p>{error}</p>}
    </form>
  )
}

export default LoginForm
