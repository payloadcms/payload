import React, { Fragment } from 'react'
import { SanitizedConfig } from 'payload/types'
import { redirect } from 'next/navigation'

export const AuthLayout = async ({
  children,
  config: configPromise,
}: {
  children: React.ReactNode
  config: Promise<SanitizedConfig>
}) => {
  const config = await configPromise

  // TODO: call the me operation server-side
  let me = null

  if (!me) {
    redirect(`${config.routes.admin || '/admin'}/login`)
  }

  return <Fragment>{children}</Fragment>
}
