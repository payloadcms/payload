import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useHistory, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import Button from '../../elements/Button'
import Form from '../../forms/Form'
import FormSubmit from '../../forms/Submit'
import ConfirmPassword from '../../forms/field-types/ConfirmPassword'
import HiddenInput from '../../forms/field-types/HiddenInput'
import Password from '../../forms/field-types/Password'
import MinimalTemplate from '../../templates/Minimal'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import Meta from '../../utilities/Meta'
import './index.scss'

const baseClass = 'reset-password'

const ResetPassword: React.FC = () => {
  const config = useConfig()
  const {
    admin: { logoutRoute, user: userSlug },
    routes: { admin, api },
    serverURL,
  } = config
  const { token } = useParams<{ token?: string }>()
  const history = useHistory()
  const { fetchFullUser, user } = useAuth()
  const { t } = useTranslation('authentication')

  const onSuccess = async (data) => {
    if (data.token) {
      await fetchFullUser()
      history.push(`${admin}`)
    } else {
      history.push(`${admin}/login`)
      toast.success(t('general:updatedSuccessfully'), { autoClose: 3000 })
    }
  }

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <Meta
          description={t('resetPassword')}
          keywords={t('resetPassword')}
          title={t('resetPassword')}
        />

        <div className={`${baseClass}__wrap`}>
          <h1>{t('alreadyLoggedIn')}</h1>
          <p>
            <Trans i18nKey="loginWithAnotherUser" t={t}>
              <Link to={`${admin}${logoutRoute}`}>log out</Link>
            </Trans>
          </p>
          <br />
          <Button buttonStyle="secondary" el="link" to={admin}>
            {t('general:backToDashboard')}
          </Button>
        </div>
      </MinimalTemplate>
    )
  }

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <h1>{t('resetPassword')}</h1>
        <Form
          action={`${serverURL}${api}/${userSlug}/reset-password`}
          method="post"
          onSuccess={onSuccess}
          redirect={admin}
        >
          <Password autoComplete="off" label={t('newPassword')} name="password" required />
          <ConfirmPassword />
          <HiddenInput name="token" value={token} />
          <FormSubmit>{t('resetPassword')}</FormSubmit>
        </Form>
      </div>
    </MinimalTemplate>
  )
}

export default ResetPassword
