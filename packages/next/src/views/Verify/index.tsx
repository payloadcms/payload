import { Logo } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import React from 'react'

import type { AdminViewProps } from '../Root'

import './index.scss'

export const verifyBaseClass = 'verify'

export { generateVerifyMetadata } from './meta'

export const Verify: React.FC<AdminViewProps> = async ({ initPageResult, params }) => {
  // /:collectionSlug/verify/:token
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [collectionSlug, verify, token] = params.segments
  const { req } = initPageResult

  const {
    payload: { config },
  } = req

  const {
    routes: { admin: adminRoute },
  } = config

  let textToRender

  try {
    await req.payload.verifyEmail({
      collection: collectionSlug,
      token,
    })

    return redirect(`${adminRoute}/login`)
  } catch (e) {
    // already verified
    if (e?.status === 202) redirect(`${adminRoute}/login`)
    textToRender = req.t('authentication:unableToVerify')
  }

  return (
    <React.Fragment>
      <div className={`${verifyBaseClass}__brand`}>
        <Logo config={config} />
      </div>
      <h2>{textToRender}</h2>
    </React.Fragment>
  )
}
