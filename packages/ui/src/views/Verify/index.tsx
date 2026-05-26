import type { AdminViewServerProps } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { Logo } from '../../elements/Logo/index.js'
import { getVerifyData } from './getVerifyData.js'
import { ToastAndRedirect } from './index.client.js'
import './index.scss'

export const verifyBaseClass = 'verify'

export type VerifyProps = {
  adminRoute: string
  isVerified: boolean
  logo?: React.ReactNode
  textToRender: string
  verifiedMessage: string
}

export function Verify({
  adminRoute,
  isVerified,
  logo,
  textToRender,
  verifiedMessage,
}: VerifyProps) {
  if (isVerified) {
    return <ToastAndRedirect message={verifiedMessage} redirectTo={`${adminRoute}/login`} />
  }

  return (
    <React.Fragment>
      <div className={`${verifyBaseClass}__brand`}>{logo ?? <Logo />}</div>
      <h2>{textToRender}</h2>
    </React.Fragment>
  )
}

export type VerifyViewProps = {
  logo?: React.ReactNode
} & AdminViewServerProps

export async function VerifyView({ initPageResult, logo, params }: VerifyViewProps) {
  const [collectionSlug, , token] = params.segments
  const { req } = initPageResult

  const {
    payload: { config },
  } = req

  const {
    routes: { admin: adminRoute },
  } = config

  const { isVerified, textToRender } = await getVerifyData({
    collectionSlug,
    req,
    token,
  })

  return (
    <Verify
      adminRoute={formatAdminURL({ adminRoute, path: '' })}
      isVerified={isVerified}
      logo={logo}
      textToRender={textToRender}
      verifiedMessage={req.t('authentication:emailVerified')}
    />
  )
}
