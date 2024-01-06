import React from 'react'

import { Button, MinimalTemplate, Logo } from '@payloadcms/ui'
import './index.scss'
import { initPage } from '../../utilities/initPage'
import { SanitizedConfig } from 'payload/types'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import i18n from 'i18next'
import { meta } from '../../utilities/meta'

const baseClass = 'verify'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> =>
  meta({
    description: i18n.t('verifyUser'),
    keywords: i18n.t('verify'),
    title: i18n.t('verify'),
    config,
  })

export const Verify: React.FC<{
  config: Promise<SanitizedConfig>
  token: string
}> = async ({
  config: configPromise,
  // token
}) => {
  const { config, user } = await initPage({ configPromise })

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
    return 'Verify'
    // if (verifyResult?.status === 200) return t('verifiedSuccessfully')
    // if (verifyResult?.status === 202) return t('alreadyActivated')
    // return t('unableToVerify')
  }

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__brand`}>
        <Logo config={config} />
      </div>
      <h2>{getText()}</h2>
      {verifyResult?.status === 200 && (
        <Button buttonStyle="secondary" el="link" to={`${adminRoute}/login`}>
          Login
          {/* {t('login')} */}
        </Button>
      )}
    </MinimalTemplate>
  )
}
export default Verify
