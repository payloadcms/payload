'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Props } from './types.js'

import { Button } from '../../../elements/Button/index.js'
import { EmailAndUsernameFields } from '../../../elements/EmailAndUsername/index.js'
import { CheckboxField } from '../../../fields/Checkbox/index.js'
import { ConfirmPasswordField } from '../../../fields/ConfirmPassword/index.js'
import { PasswordField } from '../../../fields/Password/index.js'
import { useFormFields, useFormModified } from '../../../forms/Form/context.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
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
  const { docPermissions, isInitializing } = useDocumentInfo()

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
          <EmailAndUsernameFields
            loginWithUsername={loginWithUsername}
            operation={operation}
            permissions={docPermissions?.fields}
            readOnly={readOnly}
            t={t}
          />
          {(showPasswordFields || requirePassword) && (
            <div className={`${baseClass}__changing-password`}>
              <PasswordField
                autoComplete="new-password"
                field={{
                  name: 'password',
                  _path: 'password',
                  admin: {
                    disabled,
                  },
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
                size="medium"
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
                size="medium"
              >
                {t('authentication:changePassword')}
              </Button>
            )}
            {operation === 'update' && hasPermissionToUnlock && (
              <Button
                buttonStyle="secondary"
                disabled={disabled}
                onClick={() => void unlock()}
                size="medium"
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
            field={{
              name: 'enableAPIKey',
              admin: { disabled, readOnly },
              label: t('authentication:enableAPIKey'),
            }}
          />
          <APIKey enabled={!!enableAPIKey?.value} readOnly={readOnly} />
        </div>
      )}
      {verify && (
        <CheckboxField
          field={{
            name: '_verified',
            admin: { disabled, readOnly },
            label: t('authentication:verified'),
          }}
        />
      )}
    </div>
  )
}
