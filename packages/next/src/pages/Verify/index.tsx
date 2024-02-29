import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { Button, Logo, MinimalTemplate } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import React from 'react'

import { getNextI18n } from '../../utilities/getNextI18n'
import { initPage } from '../../utilities/initPage'
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

export const Verify: React.FC<{
  config: Promise<SanitizedConfig>
  token: string
}> = async ({
  config: configPromise,
  // token
}) => {
  const { req } = await initPage({ config: configPromise })

  const {
    i18n,
    payload: { config },
    user,
  } = req

  const {
    admin: { user: userSlug },
    routes: { admin: adminRoute },
    // serverURL,
  } = config

  const verifyResult = null
  // const [verifyResult, setVerifyResult] = useState<Response | null>(null)

  // useEffect(() => {
  //   async function verifyToken() {
  //     const result = await fetch(`${serverURL}/api/${collectionSlug}/verify/${token}`, {
  //       credentials: 'include',
  //       headers: {
  //         'Accept-Language': i18n.language,
  //       },
  //       method: 'POST',
  //     })
  //     setVerifyResult(result)
  //   }
  //   verifyToken()
  // }, [setVerifyResult, collectionSlug, serverURL, token, i18n])

  if (user) {
    return redirect(`${adminRoute}/login`)
  }

  const getText = () => {
    if (verifyResult?.status === 200) return i18n.t('authentication:verifiedSuccessfully')
    if (verifyResult?.status === 202) return i18n.t('authentication:alreadyActivated')
    return i18n.t('authentication:unableToVerify')
  }

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__brand`}>
        <Logo config={config} />
      </div>
      <h2>{getText()}</h2>
      {verifyResult?.status === 200 && (
        <Button buttonStyle="secondary" el="link" to={`${adminRoute}/login`}>
          {i18n.t('authentication:login')}
        </Button>
      )}
    </MinimalTemplate>
  )
}
export default Verify
