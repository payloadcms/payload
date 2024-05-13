import type { AdminViewProps } from 'payload/types'

import { Logo } from '@payloadcms/ui/graphics/Logo'
import { redirect } from 'next/navigation.js'
import React from 'react'

import './index.scss'

export const verifyBaseClass = 'verify'

export { generateVerifyMetadata } from './meta.js'

export const Verify: React.FC<AdminViewProps> = async ({ initPageResult, params }) => {
  // /:collectionSlug/verify/:token
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [collectionSlug, verify, token] = params.segments
  const { req } = initPageResult

  const {
    payload: { config },
    payload,
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
        <Logo payload={payload} />
      </div>
      <h2>{textToRender}</h2>
    </React.Fragment>
  )
}
