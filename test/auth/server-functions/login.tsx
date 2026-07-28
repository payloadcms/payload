'use client'

import { type ChangeEvent, useState } from 'react'

import { loginFunction } from './loginFunction.js'

const LoginForm = () => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  return (
    <div>
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
      <button onClick={() => loginFunction({ email, password })} type="button">
        Custom Login
      </button>
    </div>
  )
}

export default LoginForm
