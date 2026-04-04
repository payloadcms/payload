import React from 'react'

import { Logo } from '../../elements/Logo/index.js'
import { ToastAndRedirect } from './index.client.js'
import './index.scss'

export const verifyBaseClass = 'verify'

export type VerifyViewProps = {
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
}: VerifyViewProps) {
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
