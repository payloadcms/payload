'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from '../../../providers/Translation'
import { toast } from 'react-toastify'

import type { Props } from './types'

import { Button } from '../../../elements/Button'
import { useFormFields, useFormModified } from '../../../forms/Form/context'
import Checkbox from '../../../forms/fields/Checkbox'
import ConfirmPassword from '../../../forms/fields/ConfirmPassword'
import { Email } from '../../../forms/fields/Email'
import { Password } from '../../../forms/fields/Password'
import { useConfig } from '../../../providers/Config'
import APIKey from './APIKey'

import './index.scss'

const baseClass = 'auth-fields'

const Auth: React.FC<Props> = (props) => {
  const {
    className,
    disableLocalStrategy,
    collectionSlug,
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
  const { i18n, t } = useTranslation()

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
    const url = `${serverURL}${api}/${collectionSlug}/unlock`
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
      toast.success(t('authentication:successfullyUnlocked'), { autoClose: 3000 })
    } else {
      toast.error(t('authentication:failedToUnlock'))
    }
  }, [i18n, serverURL, api, collectionSlug, email, t])

  useEffect(() => {
    if (!modified) {
      setChangingPassword(false)
    }
  }, [modified])

  if (disableLocalStrategy && !useAPIKey) {
    return null
  }

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      {!disableLocalStrategy && (
        <React.Fragment>
          <Email
            autoComplete="email"
            readOnly={readOnly}
            label={t('general:email')}
            name="email"
            required
          />
          {(changingPassword || requirePassword) && (
            <div className={`${baseClass}__changing-password`}>
              <Password
                autoComplete="off"
                disabled={readOnly}
                label={t('authentication:newPassword')}
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
                  {t('authentication:changePassword')}
                </Button>
              )}
              {operation === 'update' && (
                <Button
                  buttonStyle="secondary"
                  disabled={readOnly}
                  onClick={() => unlock()}
                  size="small"
                >
                  {t('authentication:forceUnlock')}
                </Button>
              )}
            </div>
          )}
        </React.Fragment>
      )}
      {useAPIKey && (
        <div className={`${baseClass}__api-key`}>
          <Checkbox
            readOnly={readOnly}
            label={t('authentication:enableAPIKey')}
            name="enableAPIKey"
          />
          {enableAPIKey?.value && <APIKey readOnly={readOnly} />}
        </div>
      )}
      {verify && (
        <Checkbox readOnly={readOnly} label={t('authentication:verified')} name="_verified" />
      )}
    </div>
  )
}

export default Auth
