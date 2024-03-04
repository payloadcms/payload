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

import type { AdminViewProps } from '../Root'

import './index.scss'

const baseClass = 'reset-password'

export { generateResetPasswordMetadata } from './meta'

export const ResetPassword: React.FC<AdminViewProps> = ({ initPageResult, params }) => {
  const { req } = initPageResult

  const { token } = params

  const {
    i18n,
    payload: { config },
    user,
  } = req

  const {
    admin: { user: userSlug },
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
