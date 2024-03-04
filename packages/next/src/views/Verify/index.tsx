import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { Logo } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import React from 'react'

import type { AdminViewProps } from '../Root'

import { getNextI18n } from '../../utilities/getNextI18n'
import { meta } from '../../utilities/meta'
import './index.scss'

const baseClass = 'verify'

export const generateMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const config = await configPromise

  const { t } = await getNextI18n({
    config,
  })

  return meta({
    config,
    description: t('authentication:verifyUser'),
    keywords: t('authentication:verify'),
    title: t('authentication:verify'),
  })
}

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
      <div className={`${baseClass}__brand`}>
        <Logo config={config} />
      </div>
      <h2>{textToRender}</h2>
    </React.Fragment>
  )
}
export default Verify
