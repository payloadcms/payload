import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

import type { Props } from './types'

import Button from '../../../../elements/Button'
import { useFormFields, useFormModified } from '../../../../forms/Form/context'
import Checkbox from '../../../../forms/field-types/Checkbox'
import ConfirmPassword from '../../../../forms/field-types/ConfirmPassword'
import Email from '../../../../forms/field-types/Email'
import Password from '../../../../forms/field-types/Password'
import { useConfig } from '../../../../utilities/Config'
import APIKey from './APIKey'
import './index.scss'

const baseClass = 'auth-fields'

const Auth: React.FC<Props> = (props) => {
  const {
    className,
    collection,
    collection: { slug },
    email,
    operation,
    readOnly,
    requirePassword,
    useAPIKey,
    verify,
  } = props

  const [changingPassword, setChangingPassword] = useState(requirePassword)
  const enableAPIKey = useFormFields(([fields]) => fields.enableAPIKey)
  const dispatchFields = useFormFields((reducer) => reducer[1])
  const modified = useFormModified()
  const { i18n, t } = useTranslation('authentication')

  const {
    routes: { api },
    serverURL,
  } = useConfig()

  const handleChangePassword = useCallback(
    async (state: boolean) => {
      if (!state) {
        dispatchFields({ path: 'password', type: 'REMOVE' })
        dispatchFields({ path: 'confirm-password', type: 'REMOVE' })
      }

      setChangingPassword(state)
    },
    [dispatchFields],
  )

  const unlock = useCallback(async () => {
    const url = `${serverURL}${api}/${slug}/unlock`
    const response = await fetch(url, {
      body: JSON.stringify({
        email,
      }),
      credentials: 'include',
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json',
      },
      method: 'post',
    })

    if (response.status === 200) {
      toast.success(t('successfullyUnlocked'), { autoClose: 3000 })
    } else {
      toast.error(t('failedToUnlock'))
    }
  }, [i18n, serverURL, api, slug, email, t])

  useEffect(() => {
    if (!modified) {
      setChangingPassword(false)
    }
  }, [modified])

  if (collection.auth.disableLocalStrategy && !collection.auth.useAPIKey) {
    return null
  }

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      {!collection.auth.disableLocalStrategy && (
        <React.Fragment>
          <Email
            admin={{ autoComplete: 'email', readOnly }}
            label={t('general:email')}
            name="email"
            required
          />
          {(changingPassword || requirePassword) && (
            <div className={`${baseClass}__changing-password`}>
              <Password
                autoComplete="off"
                disabled={readOnly}
                label={t('newPassword')}
                name="password"
                required
              />
              <ConfirmPassword disabled={readOnly} />
              {!requirePassword && (
                <Button
                  buttonStyle="secondary"
                  disabled={readOnly}
                  onClick={() => handleChangePassword(false)}
                  size="small"
                >
                  {t('general:cancel')}
                </Button>
              )}
            </div>
          )}
          {((!changingPassword && !requirePassword) || operation === 'update') && (
            <div className={`${baseClass}__controls`}>
              {!changingPassword && !requirePassword && (
                <Button
                  buttonStyle="secondary"
                  disabled={readOnly}
                  id="change-password"
                  onClick={() => handleChangePassword(true)}
                  size="small"
                >
                  {t('changePassword')}
                </Button>
              )}
              {operation === 'update' && (
                <Button
                  buttonStyle="secondary"
                  disabled={readOnly}
                  onClick={() => unlock()}
                  size="small"
                >
                  {t('forceUnlock')}
                </Button>
              )}
            </div>
          )}
        </React.Fragment>
      )}
      {useAPIKey && (
        <div className={`${baseClass}__api-key`}>
          <Checkbox admin={{ readOnly }} label={t('enableAPIKey')} name="enableAPIKey" />
          <APIKey enabled={!!enableAPIKey?.value} readOnly={readOnly} />
        </div>
      )}
      {verify && <Checkbox admin={{ readOnly }} label={t('verified')} name="_verified" />}
    </div>
  )
}

export default Auth
