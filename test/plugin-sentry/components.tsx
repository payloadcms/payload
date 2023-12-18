import React from 'react'
import * as Sentry from '@sentry/react'
export const testErrors = () => {
  const notFound = async () => {
    const req = await fetch('http://localhost:3000/api/users/notFound', {
      method: 'GET',
    })
  }

  const cannotCreate = async () => {
    const req = await fetch('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        text: 'New post',
      }),
    })
  }

  const badLogin = async () => {
    const req = await fetch('http://localhost:3000/api/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'sorry@whoareyou.com',
        password: '123456',
      }),
    })
  }

  const badReq = async () => {
    const req = await fetch('http://localhost:3000/api/users/forgot-password', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  const badReset = async () => {
    const req = await fetch('http://localhost:3000/api/users/reset-password', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: '7eac3830ffcfc7f9f66c00315dabeb11575dba91',
        password: 'newPassword',
      }),
    })
  }

  const badVerify = async () => {
    const req = await fetch('http://localhost:3000/api/users/unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  return (
    <Sentry.ErrorBoundary>
      <h4>Test Errors</h4>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button style={{ marginBottom: '20px' }} onClick={() => notFound()} type="button">
          Not Found
        </button>

        <button style={{ marginBottom: '20px' }} onClick={() => cannotCreate()} type="button">
          Forbidden
        </button>

        <button style={{ marginBottom: '20px' }} onClick={() => badLogin()} type="button">
          Bad login
        </button>

        <button style={{ marginBottom: '20px' }} onClick={() => badReq()} type="button">
          TypeError
        </button>

        <button style={{ marginBottom: '20px' }} onClick={() => badReset()} type="button">
          Bad Reset
        </button>

        <button style={{ marginBottom: '20px' }} onClick={() => badVerify()} type="button">
          Bad Verify
        </button>
      </div>
    </Sentry.ErrorBoundary>
  )
}
