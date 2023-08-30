import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useHistory, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import Button from '../../elements/Button/index.js'
import Form from '../../forms/Form/index.js'
import FormSubmit from '../../forms/Submit/index.js'
import ConfirmPassword from '../../forms/field-types/ConfirmPassword/index.js'
import HiddenInput from '../../forms/field-types/HiddenInput/index.js'
import Password from '../../forms/field-types/Password/index.js'
import MinimalTemplate from '../../templates/Minimal/index.js'
import { useAuth } from '../../utilities/Auth/index.js'
import { useConfig } from '../../utilities/Config/index.js'
import Meta from '../../utilities/Meta/index.js'
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
  const { setToken, user } = useAuth()
  const { t } = useTranslation('authentication')

  const onSuccess = (data) => {
    if (data.token) {
      setToken(data.token)
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
