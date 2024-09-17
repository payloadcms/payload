'use client'
import * as Sentry from '@sentry/react'
import React from 'react'
export const testErrors = () => {
  const notFound = async () => {
    const req = await fetch('http://localhost:3000/api/users/notFound', {
      method: 'GET',
    })
  }

  const cannotCreate = async () => {
    const req = await fetch('http://localhost:3000/api/posts', {
      body: JSON.stringify({
        text: 'New post',
      }),
      method: 'POST',
    })
  }

  const badLogin = async () => {
    const req = await fetch('http://localhost:3000/api/users/login', {
      body: JSON.stringify({
        email: 'sorry@whoareyou.com',
        password: '123456',
      }),
      method: 'POST',
    })
  }

  const badReq = async () => {
    const req = await fetch('http://localhost:3000/api/users/forgot-password', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
  }

  const badReset = async () => {
    const req = await fetch('http://localhost:3000/api/users/reset-password', {
      body: JSON.stringify({
        password: 'newPassword',
        token: '7eac3830ffcfc7f9f66c00315dabeb11575dba91',
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
  }

  const badVerify = async () => {
    const req = await fetch('http://localhost:3000/api/users/unlock', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
  }

  return (
    <Sentry.ErrorBoundary>
      <h4>Test Errors</h4>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => notFound()} style={{ marginBottom: '20px' }} type="button">
          Not Found
        </button>

        <button onClick={() => cannotCreate()} style={{ marginBottom: '20px' }} type="button">
          Forbidden
        </button>

        <button onClick={() => badLogin()} style={{ marginBottom: '20px' }} type="button">
          Bad login
        </button>

        <button onClick={() => badReq()} style={{ marginBottom: '20px' }} type="button">
          TypeError
        </button>

        <button onClick={() => badReset()} style={{ marginBottom: '20px' }} type="button">
          Bad Reset
        </button>

        <button onClick={() => badVerify()} style={{ marginBottom: '20px' }} type="button">
          Bad Verify
        </button>
      </div>
    </Sentry.ErrorBoundary>
  )
}
