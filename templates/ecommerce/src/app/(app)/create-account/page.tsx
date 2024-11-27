import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import { getMeUser } from '@/utilities/getMeUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'

import { CreateAccountForm } from './CreateAccountForm'

export default async function CreateAccount() {
  await getMeUser({
    validUserRedirect: `/account?warning=${encodeURIComponent(
      'Cannot create a new account while logged in, please log out and try again.',
    )}`,
  })

  return (
    <div className="container">
      <h1 className="text-xl mb-4">Create Account</h1>
      <RenderParams />
      <CreateAccountForm />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
