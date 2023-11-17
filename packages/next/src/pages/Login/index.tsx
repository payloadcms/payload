import React from 'react'
import { SanitizedConfig } from 'payload/types'
import { Login as LoginView } from '@payloadcms/ui/views'
import Link from 'next/link'

export const Login = async ({ config: configPromise }: { config: Promise<SanitizedConfig> }) => {
  const config = await configPromise
  return <LoginView config={config} Link={Link} />
}
