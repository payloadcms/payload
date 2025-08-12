'use client'
import type { FormEvent } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import './index.scss'

const baseClass = 'loginPage'

// go to /tenant1/home
// redirects to /tenant1/login?redirect=%2Ftenant1%2Fhome
// login, uses slug to set payload-tenant cookie

type Props = {
  tenantSlug?: string
  tenantDomain?: string
}
export const Login = ({ tenantSlug, tenantDomain }: Props) => {
  const usernameRef = React.useRef<HTMLInputElement>(null)
  const passwordRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!usernameRef?.current?.value || !passwordRef?.current?.value) {
      return
    }
    const actionRes = await fetch('/api/users/external-users/login', {
      body: JSON.stringify({
        password: passwordRef.current.value,
        tenantSlug,
        tenantDomain,
        username: usernameRef.current.value,
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'post',
    })
    const json = await actionRes.json()

    if (actionRes.status === 200 && json.user) {
      const redirectTo = searchParams.get('redirect')
      if (redirectTo) {
        router.push(redirectTo)
        return
      } else {
        if (tenantDomain) {
          router.push('/tenant-domains')
        } else {
          router.push(`/tenant-slugs/${tenantSlug}`)
        }
      }
    } else if (actionRes.status === 400 && json?.errors?.[0]?.message) {
      window.alert(json.errors[0].message)
    } else {
      window.alert('Something went wrong, please try again.')
    }
  }

  return (
    <div className={baseClass}>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Username
            <input name="username" ref={usernameRef} type="text" />
          </label>
        </div>
        <div>
          <label>
            Password
            <input name="password" ref={passwordRef} type="password" />
          </label>
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  )
}
