'use client'

import { type ChangeEvent, type FormEvent, useState } from 'react'

import { loginFunction } from './loginFunction.js'

const LoginForm = () => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  return (
    <form onSubmit={() => loginFunction({ email, password })}>
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
    </form>
  )
}

export default LoginForm
