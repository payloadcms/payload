'use client'

import { Button } from '@payloadcms/ui'
import React, { useEffect, useId, useRef, useState } from 'react'

import './index.css'

type Mode = 'manage' | 'setup' | 'verify'

type Props = {
  adminRoute: string
  apiRoute: string
  email: string
  mode: Mode
  redirectTo: string
}

type Setup = { qrCode: string; secret: string }

const baseClass = 'two-factor'

export function TwoFactorForm({ adminRoute, apiRoute, email, mode, redirectTo }: Props) {
  const inputID = useId()
  const errorID = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [setup, setSetup] = useState<null | Setup>(null)
  const [backupCodes, setBackupCodes] = useState<null | string[]>(null)

  const post = async ({ body, path }: { body?: object; path: string }) => {
    const res = await fetch(`${apiRoute}/users/2fa/${path}`, {
      body: JSON.stringify(body ?? {}),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data?.errors?.[0]?.message || 'Something went wrong. Try again.')
    }

    return data
  }

  useEffect(() => {
    if (mode !== 'setup') {
      return
    }

    post({ path: 'setup' })
      .then((data: Setup) => setSetup(data))
      .catch((err: Error) => setError(err.message))
    // Starts a new setup once per page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'setup') {
        const data = await post({ body: { code }, path: 'enable' })
        setBackupCodes(data.backupCodes)
      } else if (mode === 'verify') {
        await post({ body: { code }, path: 'verify' })
        window.location.assign(redirectTo)
      } else {
        await post({ body: { code }, path: 'reset' })
        window.location.reload()
      }
    } catch (err) {
      setError((err as Error).message)
      setCode('')
      inputRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (backupCodes) {
    return (
      <div className={baseClass}>
        <h1>Save your backup codes</h1>
        <p>
          Two-factor authentication is on. If you lose your phone, each of these codes lets you log
          in once instead of a code from the app. They are shown only now: store them somewhere
          safe, such as a password manager.
        </p>
        <ul aria-label="Backup codes" className={`${baseClass}__backup-codes`}>
          {backupCodes.map((backupCode) => (
            <li key={backupCode}>
              <code>{backupCode}</code>
            </li>
          ))}
        </ul>
        <Button onClick={() => window.location.assign(redirectTo)}>I saved my backup codes</Button>
      </div>
    )
  }

  const content = {
    manage: {
      button: 'Reset two-factor',
      intro:
        'Two-factor authentication is on for this account. To move it to a new phone, enter a current code (or a backup code) to reset it, then set it up again.',
      title: 'Two-factor authentication',
    },
    setup: {
      button: 'Turn on two-factor',
      intro:
        'This account needs two-factor authentication. Scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, …), then enter the 6-digit code it shows.',
      title: 'Set up two-factor authentication',
    },
    verify: {
      button: 'Verify',
      intro: 'Enter the 6-digit code from your authenticator app, or one of your backup codes.',
      title: 'Two-factor authentication',
    },
  }[mode]

  return (
    <div className={baseClass}>
      <h1>{content.title}</h1>
      <p>{content.intro}</p>

      {mode === 'setup' && setup && (
        <div className={`${baseClass}__setup`}>
          <div
            aria-label={`QR code for ${email}`}
            className={`${baseClass}__qr`}
            // SVG generated on the server by the qrcode library from our own otpauth link
            dangerouslySetInnerHTML={{ __html: setup.qrCode }}
            role="img"
          />
          <p>
            Can't scan it? Enter this key in the app instead:
            <br />
            <code className={`${baseClass}__secret`}>
              {setup.secret.match(/.{1,4}/g)?.join(' ')}
            </code>
          </p>
        </div>
      )}

      <form className={`${baseClass}__form`} noValidate onSubmit={submit}>
        <label htmlFor={inputID}>
          {mode === 'verify' || mode === 'manage' ? 'Code' : '6-digit code'}
        </label>
        <input
          aria-describedby={error ? errorID : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="one-time-code"
          autoFocus
          id={inputID}
          inputMode={mode === 'setup' ? 'numeric' : 'text'}
          maxLength={mode === 'setup' ? 6 : 11}
          onChange={(event) => setCode(event.target.value)}
          ref={inputRef}
          required
          spellCheck={false}
          value={code}
        />
        {error && (
          <p className={`${baseClass}__error`} id={errorID} role="alert">
            {error}
          </p>
        )}
        <Button
          buttonStyle={mode === 'manage' ? 'destructive' : 'primary'}
          disabled={isSubmitting || !code.trim() || (mode === 'setup' && !setup)}
          type="submit"
        >
          {content.button}
        </Button>
      </form>

      <p className={`${baseClass}__links`}>
        {mode === 'manage' ? (
          <a href={adminRoute}>Back to the admin panel</a>
        ) : (
          <a href={`${adminRoute}/logout`}>Log out</a>
        )}
      </p>
    </div>
  )
}
