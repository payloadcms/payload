import React from 'react'

import {
  MinimalTemplate,
  Button,
  Form,
  FormSubmit,
  ConfirmPassword,
  HiddenInput,
  Password,
  Translation,
} from '@payloadcms/ui'
import './index.scss'
import { SanitizedConfig } from 'payload/types'
import Link from 'next/link'
import { initPage } from '../../utilities/initPage'
import { Metadata } from 'next'
import { meta } from '../../utilities/meta'
import { getNextT } from '../../utilities/getNextT'

const baseClass = 'reset-password'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const t = await getNextT({
    config: await config,
  })

  return meta({
    title: t('authentication:resetPassword'),
    description: t('authentication:resetPassword'),
    keywords: t('authentication:resetPassword'),
    config,
  })
}

export const ResetPassword: React.FC<{
  config: Promise<SanitizedConfig>
  token: string
}> = async ({ config: configPromise, token }) => {
  const { config, user, i18n } = await initPage({ configPromise })

  const {
    admin: { logoutRoute, user: userSlug },
    routes: { admin, api },
    serverURL,
  } = config

  // const onSuccess = async (data) => {
  //   if (data.token) {
  //     await fetchFullUser()
  //     history.push(`${admin}`)
  //   } else {
  //     history.push(`${admin}/login`)
  //     toast.success(i18n.t('general:updatedSuccessfully'), { autoClose: 3000 })
  //   }
  // }

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <div className={`${baseClass}__wrap`}>
          <h1>{i18n.t('authentication:alreadyLoggedIn')}</h1>
          <p>
            <Translation
              t={i18n.t}
              i18nKey="authentication:loggedInChangePassword"
              elements={{
                '0': ({ children }) => <Link href={`${admin}/account`} children={children} />,
              }}
            />
          </p>
          <br />
          <Button buttonStyle="secondary" el="link" to={admin}>
            {i18n.t('general:backToDashboard')}
          </Button>
        </div>
      </MinimalTemplate>
    )
  }

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <h1>{i18n.t('authentication:resetPassword')}</h1>
        <Form
          action={`${serverURL}${api}/${userSlug}/reset-password`}
          method="POST"
          // onSuccess={onSuccess}
          redirect={admin}
        >
          <Password
            autoComplete="off"
            label={i18n.t('authentication:newPassword')}
            name="password"
            required
          />
          <ConfirmPassword />
          <HiddenInput name="token" value={token} />
          <FormSubmit>{i18n.t('authentication:resetPassword')}</FormSubmit>
        </Form>
      </div>
    </MinimalTemplate>
  )
}
