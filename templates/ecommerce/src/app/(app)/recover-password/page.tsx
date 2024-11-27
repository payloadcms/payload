import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'

import { RecoverPasswordForm } from './RecoverPasswordForm'

export default async function RecoverPassword() {
  return (
    <div className="container py-16">
      <RecoverPasswordForm />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Enter your email address to recover your password.',
  openGraph: mergeOpenGraph({
    title: 'Recover Password',
    url: '/recover-password',
  }),
  title: 'Recover Password',
}
