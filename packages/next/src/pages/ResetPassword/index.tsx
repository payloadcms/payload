import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import {
  Button,
  ConfirmPassword,
  Form,
  FormSubmit,
  HiddenInput,
  MinimalTemplate,
  Password,
  Translation,
} from '@payloadcms/ui'
import Link from 'next/link'
import React from 'react'

import { getNextT } from '../../utilities/getNextT'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta'
import './index.scss'

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
    config,
    description: t('authentication:resetPassword'),
    keywords: t('authentication:resetPassword'),
    title: t('authentication:resetPassword'),
  })
}

export const ResetPassword: React.FC<{
  config: Promise<SanitizedConfig>
  token: string
}> = async ({ config: configPromise, token }) => {
  const { config, i18n, user } = await initPage({ config: configPromise })

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
              elements={{
                '0': ({ children }) => <Link children={children} href={`${admin}/account`} />,
              }}
              i18nKey="authentication:loggedInChangePassword"
              t={i18n.t}
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
