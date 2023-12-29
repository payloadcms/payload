import React from 'react'

import {
  MinimalTemplate,
  Button,
  Form,
  FormSubmit,
  ConfirmPassword,
  HiddenInput,
  Password,
} from '@payloadcms/ui'
import './index.scss'
import { SanitizedConfig } from 'payload/types'
import Link from 'next/link'
import { initPage } from '../../utilities/initPage'
import i18n from 'i18next'
import { Metadata } from 'next'
import { meta } from '../../utilities/meta'

const baseClass = 'reset-password'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> =>
  meta({
    title: i18n.t('resetPassword'),
    description: i18n.t('resetPassword'),
    keywords: i18n.t('resetPassword'),
    config,
  })

export const ResetPassword: React.FC<{
  config: Promise<SanitizedConfig>
  token: string
}> = async ({ config: configPromise, token }) => {
  const { config, user } = await initPage(configPromise)

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
  //     toast.success(t('general:updatedSuccessfully'), { autoClose: 3000 })
  //   }
  // }

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <div className={`${baseClass}__wrap`}>
          <h1>
            Already Logged In
            {/* {t('alreadyLoggedIn')} */}
          </h1>
          <p>
            {/* <Trans i18nKey="loginWithAnotherUser" t={t}> */}
            <Link href={`${admin}${logoutRoute}`}>log out</Link>
            {/* </Trans> */}
          </p>
          <br />
          <Button buttonStyle="secondary" el="link" to={admin}>
            Back to Dashboard
            {/* {t('general:backToDashboard')} */}
          </Button>
        </div>
      </MinimalTemplate>
    )
  }

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        Reset Password
        {/* <h1>{t('resetPassword')}</h1> */}
        <Form
          action={`${serverURL}${api}/${userSlug}/reset-password`}
          method="POST"
          // onSuccess={onSuccess}
          redirect={admin}
        >
          <Password
            autoComplete="off"
            label="New Password"
            // label={t('newPassword')}
            name="password"
            required
          />
          <ConfirmPassword />
          <HiddenInput name="token" value={token} />
          <FormSubmit>
            Reset Password
            {/* {t('resetPassword')} */}
          </FormSubmit>
        </Form>
      </div>
    </MinimalTemplate>
  )
}
