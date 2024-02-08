import React from 'react'

import { Button, MinimalTemplate, Logo } from '@payloadcms/ui'
import './index.scss'
import { initPage } from '../../utilities/initPage'
import { SanitizedConfig } from 'payload/types'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { meta } from '../../utilities/meta'
import { getNextT } from '../../utilities/getNextT'

const baseClass = 'verify'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const t = await getNextT({
    config: await config,
  })

  return meta({
    description: t('authentication:verifyUser'),
    keywords: t('authentication:verify'),
    title: t('authentication:verify'),
    config,
  })
}

export const Verify: React.FC<{
  config: Promise<SanitizedConfig>
  token: string
}> = async ({
  config: configPromise,
  // token
}) => {
  const { config, user, i18n } = await initPage({ configPromise })

  const {
    admin: { user: userSlug },
    routes: { admin: adminRoute },
    // serverURL,
  } = config

  let verifyResult = null
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
