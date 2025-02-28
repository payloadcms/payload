'use client'

import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
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
    setValidateBeforeSubmit,
    useAPIKey,
    username,
    verify,
  } = props

  const { permissions } = useAuth()
  const [changingPassword, setChangingPassword] = useState(requirePassword)
  const enableAPIKey = useFormFields(([fields]) => (fields && fields?.enableAPIKey) || null)
  const dispatchFields = useFormFields((reducer) => reducer[1])
  const modified = useFormModified()
  const { i18n, t } = useTranslation()
  const { docPermissions, isEditing, isInitializing } = useDocumentInfo()
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const enableFields =
    !disableLocalStrategy ||
    (typeof disableLocalStrategy === 'object' && disableLocalStrategy.enableFields === true)

  const disabled = readOnly || isInitializing

  const apiKeyPermissions =
    docPermissions?.fields === true ? true : docPermissions?.fields?.enableAPIKey

  const apiKeyReadOnly =
    readOnly ||
    apiKeyPermissions === true ||
    (apiKeyPermissions && typeof apiKeyPermissions === 'object' && !apiKeyPermissions?.update)

  const enableAPIKeyReadOnly =
    readOnly || (apiKeyPermissions !== true && !apiKeyPermissions?.update)

  const canReadApiKey = apiKeyPermissions === true || apiKeyPermissions?.read

  const hasPermissionToUnlock: boolean = useMemo(() => {
    const collection = permissions?.collections?.[collectionSlug]

    if (collection) {
      return Boolean('unlock' in collection ? collection.unlock : undefined)
    }

    return false
  }, [permissions, collectionSlug])

  const handleChangePassword = useCallback(
    (showPasswordFields: boolean) => {
      if (showPasswordFields) {
        setValidateBeforeSubmit(true)

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
        dispatchFields({ type: 'REMOVE', path: 'password' })
        dispatchFields({ type: 'REMOVE', path: 'confirm-password' })
      }

      setChangingPassword(showPasswordFields)
    },
    [dispatchFields, t, setValidateBeforeSubmit],
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

  if (disableLocalStrategy && !enableFields && !useAPIKey) {
    return null
  }

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      {enableFields && (
        <React.Fragment>
          <EmailAndUsernameFields
            loginWithUsername={loginWithUsername}
            operation={operation}
            permissions={docPermissions?.fields}
            readOnly={readOnly}
            t={t}
          />
          {(changingPassword || requirePassword) && (!disableLocalStrategy || !enableFields) && (
            <div className={`${baseClass}__changing-password`}>
              <PasswordField
                autoComplete="new-password"
                field={{
                  name: 'password',
                  label: t('authentication:newPassword'),
                  required: true,
                }}
                indexPath=""
                parentPath=""
                parentSchemaPath=""
                path="password"
                schemaPath="password"
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
                size="medium"
              >
                {t('general:cancel')}
              </Button>
            )}
            {!changingPassword && !requirePassword && !disableLocalStrategy && (
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
          {canReadApiKey && (
            <Fragment>
              <CheckboxField
                field={{
                  name: 'enableAPIKey',
                  admin: { disabled, readOnly: enableAPIKeyReadOnly },
                  label: t('authentication:enableAPIKey'),
                }}
                path="enableAPIKey"
                schemaPath={`${collectionSlug}.enableAPIKey`}
              />
              <APIKey enabled={!!enableAPIKey?.value} readOnly={apiKeyReadOnly} />
            </Fragment>
          )}
        </div>
      )}
      {verify && isEditing && (
        <CheckboxField
          field={{
            name: '_verified',
            admin: { disabled, readOnly },
            label: t('authentication:verified'),
          }}
          path="_verified"
          schemaPath={`${collectionSlug}._verified`}
        />
      )}
    </div>
  )
}
