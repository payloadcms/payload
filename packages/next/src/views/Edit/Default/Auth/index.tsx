'use client'

import { Button } from '@payloadcms/ui/elements/Button'
import { Checkbox } from '@payloadcms/ui/fields/Checkbox'
import { ConfirmPassword } from '@payloadcms/ui/fields/ConfirmPassword'
import { Email } from '@payloadcms/ui/fields/Email'
import { Password } from '@payloadcms/ui/fields/Password'
import { useFormFields, useFormModified } from '@payloadcms/ui/forms/Form'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import type { Props } from './types.js'

import { APIKey } from './APIKey.js'
import './index.scss'

const baseClass = 'auth-fields'

export const Auth: React.FC<Props> = (props) => {
  const {
    className,
    collectionSlug,
    disableLocalStrategy,
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
    (state: boolean) => {
      if (!state) {
        dispatchFields({ type: 'REMOVE', path: 'password' })
        dispatchFields({ type: 'REMOVE', path: 'confirm-password' })
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
            label={t('general:email')}
            name="email"
            readOnly={readOnly}
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
            </div>
          )}

          <div className={`${baseClass}__controls`}>
            {changingPassword && !requirePassword && (
              <Button
                buttonStyle="secondary"
                disabled={readOnly}
                onClick={() => handleChangePassword(false)}
                size="small"
              >
                {t('general:cancel')}
              </Button>
            )}
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
        </React.Fragment>
      )}
      {useAPIKey && (
        <div className={`${baseClass}__api-key`}>
          <Checkbox
            label={t('authentication:enableAPIKey')}
            name="enableAPIKey"
            readOnly={readOnly}
          />
          <APIKey enabled={!!enableAPIKey?.value} readOnly={readOnly} />
        </div>
      )}
      {verify && (
        <Checkbox label={t('authentication:verified')} name="_verified" readOnly={readOnly} />
      )}
    </div>
  )
}
