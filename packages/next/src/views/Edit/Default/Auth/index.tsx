'use client'

import {
  Button,
  CheckboxField,
  ConfirmPasswordField,
  EmailField,
  PasswordField,
  TextField,
  useAuth,
  useConfig,
  useDocumentInfo,
  useFormFields,
  useFormModified,
  useTranslation,
} from '@payloadcms/ui'
import { email as emailValidation } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
    setValidateBeforeSubmit,
    useAPIKey,
    username,
    verify,
  } = props

  const { permissions } = useAuth()
  const [changingPassword, setChangingPassword] = useState(requirePassword)
  const enableAPIKey = useFormFields(([fields]) => (fields && fields?.enableAPIKey) || null)
  const forceOpenChangePassword = useFormFields(([fields]) => (fields && fields?.password) || null)
  const dispatchFields = useFormFields((reducer) => reducer[1])
  const modified = useFormModified()
  const { i18n, t } = useTranslation()
  const { isInitializing } = useDocumentInfo()

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const hasPermissionToUnlock: boolean = useMemo(() => {
    const collection = permissions?.collections?.[collectionSlug]

    if (collection) {
      const unlock = 'unlock' in collection ? collection.unlock : undefined

      if (unlock) {
        // current types for permissions do not include auth permissions, this will be fixed in another branch soon, for now we need to ignore the types
        // @todo: fix types
        // @ts-expect-error
        return unlock.permission
      }
    }

    return false
  }, [permissions, collectionSlug])

  const handleChangePassword = useCallback(
    (showPasswordFields: boolean) => {
      if (showPasswordFields) {
        setValidateBeforeSubmit(true)
        setSchemaPath(`_${collectionSlug}.auth`)
        dispatchFields({
          type: 'UPDATE',
          errorMessage: t('validation:required'),
          path: 'password',
          valid: false,
        })
        dispatchFields({
          type: 'UPDATE',
          errorMessage: t('validation:required'),
          path: 'confirm-password',
          valid: false,
        })
      } else {
        setValidateBeforeSubmit(false)
        setSchemaPath(collectionSlug)
        dispatchFields({ type: 'REMOVE', path: 'password' })
        dispatchFields({ type: 'REMOVE', path: 'confirm-password' })
      }

      setChangingPassword(showPasswordFields)
    },
    [dispatchFields, t, collectionSlug, setSchemaPath, setValidateBeforeSubmit],
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

  const showPasswordFields = changingPassword || forceOpenChangePassword

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
              clientFieldConfig={{
                name: 'email',
                disabled,
                label: t('general:email'),
                required: !loginWithUsername || loginWithUsername?.requireEmail,
              }}
              readOnly={readOnly}
              validate={(value) =>
                emailValidation(value, {
                  name: 'email',
                  type: 'email',
                  data: {},
                  preferences: { fields: {} },
                  req: { t } as any,
                  required: true,
                  siblingData: {},
                })
              }
            />
          )}
          {(showPasswordFields || requirePassword) && (
            <div className={`${baseClass}__changing-password`}>
              <PasswordField
                clientFieldConfig={{
                  name: 'password',
                  _path: 'password',
                  disabled,
                  label: t('authentication:newPassword'),
                  required: true,
                }}
              />
              <ConfirmPasswordField disabled={readOnly} />
            </div>
          )}
          <div className={`${baseClass}__controls`}>
            {showPasswordFields && !requirePassword && (
              <Button
                buttonStyle="secondary"
                disabled={disabled}
                onClick={() => handleChangePassword(false)}
                size="small"
              >
                {t('general:cancel')}
              </Button>
            )}
            {!showPasswordFields && !requirePassword && (
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
            {operation === 'update' && hasPermissionToUnlock && (
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
            clientFieldConfig={{
              name: 'enableAPIKey',
              disabled,
              label: t('authentication:enableAPIKey'),
            }}
            readOnly={readOnly}
          />
          <APIKey enabled={!!enableAPIKey?.value} readOnly={readOnly} />
        </div>
      )}
      {verify && (
        <CheckboxField
          clientFieldConfig={{
            name: '_verified',
            disabled,
            label: t('authentication:verified'),
          }}
          readOnly={readOnly}
        />
      )}
    </div>
  )
}
