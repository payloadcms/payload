'use client'

import {
  Button,
  CheckboxField,
  ConfirmPasswordField,
  EmailField,
  PasswordField,
  TextField,
  useConfig,
  useDocumentInfo,
  useFormFields,
  useFormModified,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

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
    loginWithUsername,
    operation,
    readOnly,
    requirePassword,
    setSchemaPath,
    useAPIKey,
    username,
    verify,
  } = props

  const [changingPassword, setChangingPassword] = useState(requirePassword)
  const enableAPIKey = useFormFields(([fields]) => (fields && fields?.enableAPIKey) || null)
  const dispatchFields = useFormFields((reducer) => reducer[1])
  const modified = useFormModified()
  const { i18n, t } = useTranslation()
  const { isInitializing } = useDocumentInfo()

  const {
    routes: { api },
    serverURL,
  } = useConfig()

  const handleChangePassword = useCallback(
    (showPasswordFields: boolean) => {
      if (showPasswordFields) {
        setSchemaPath(`_${collectionSlug}.auth`)
      } else {
        setSchemaPath(collectionSlug)
        dispatchFields({ type: 'REMOVE', path: 'password' })
        dispatchFields({ type: 'REMOVE', path: 'confirm-password' })
      }

      setChangingPassword(showPasswordFields)
    },
    [collectionSlug, dispatchFields, setSchemaPath],
  )

  const unlock = useCallback(async () => {
    const url = `${serverURL}${api}/${collectionSlug}/unlock`
    const response = await fetch(url, {
      body:
        loginWithUsername && username ? JSON.stringify({ username }) : JSON.stringify({ email }),
      credentials: 'include',
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json',
      },
      method: 'post',
    })

    if (response.status === 200) {
      toast.success(t('authentication:successfullyUnlocked'))
    } else {
      toast.error(t('authentication:failedToUnlock'))
    }
  }, [i18n, serverURL, api, collectionSlug, email, username, t, loginWithUsername])

  useEffect(() => {
    if (!modified) {
      setChangingPassword(false)
    }
  }, [modified])

  if (disableLocalStrategy && !useAPIKey) {
    return null
  }

  const disabled = readOnly || isInitializing

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      {!disableLocalStrategy && (
        <React.Fragment>
          {Boolean(loginWithUsername) && (
            <TextField
              disabled={disabled}
              label={t('authentication:username')}
              name="username"
              readOnly={readOnly}
              required
            />
          )}
          {(!loginWithUsername ||
            loginWithUsername?.allowEmailLogin ||
            loginWithUsername?.requireEmail) && (
            <EmailField
              autoComplete="email"
              disabled={disabled}
              label={t('general:email')}
              name="email"
              readOnly={readOnly}
              required={!loginWithUsername || loginWithUsername?.requireEmail}
            />
          )}
          {(changingPassword || requirePassword) && (
            <div className={`${baseClass}__changing-password`}>
              <PasswordField
                autoComplete="off"
                disabled={disabled}
                label={t('authentication:newPassword')}
                name="password"
                required
              />
              <ConfirmPasswordField disabled={readOnly} />
            </div>
          )}
          <div className={`${baseClass}__controls`}>
            {changingPassword && !requirePassword && (
              <Button
                buttonStyle="secondary"
                disabled={disabled}
                onClick={() => handleChangePassword(false)}
                size="small"
              >
                {t('general:cancel')}
              </Button>
            )}
            {!changingPassword && !requirePassword && (
              <Button
                buttonStyle="secondary"
                disabled={disabled}
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
                disabled={disabled}
                onClick={() => void unlock()}
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
          <CheckboxField
            disabled={disabled}
            label={t('authentication:enableAPIKey')}
            name="enableAPIKey"
            readOnly={readOnly}
          />
          <APIKey enabled={!!enableAPIKey?.value} readOnly={readOnly} />
        </div>
      )}
      {verify && (
        <CheckboxField
          disabled={disabled}
          label={t('authentication:verified')}
          name="_verified"
          readOnly={readOnly}
        />
      )}
    </div>
  )
}
