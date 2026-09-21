'use client'

import type { FormState, PayloadRequest } from 'payload'

import { email, formatAdminURL, text } from 'payload/shared'
import React, { useEffect, useRef, useState } from 'react'

import type { FormProps } from '../../../forms/Form/index.js'

import { Button } from '../../../elements/Button/index.js'
import { FormHeader } from '../../../elements/FormHeader/index.js'
import { Link } from '../../../elements/Link/index.js'
import { EmailField } from '../../../fields/Email/index.js'
import { TextField } from '../../../fields/Text/index.js'
import { Form } from '../../../forms/Form/index.js'
import { FormSubmit } from '../../../forms/Submit/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'forgot-password__form'

type StoredForgotPasswordRequest = {
  identifier: string
  resendAvailableAt: number
}

const formatResendDelay = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

const removeStoredRequest = (sessionStorageKey: string): void => {
  try {
    window.sessionStorage.removeItem(sessionStorageKey)
  } catch {
    return
  }
}

const saveStoredRequest = ({
  request,
  sessionStorageKey,
}: {
  request: StoredForgotPasswordRequest
  sessionStorageKey: string
}): void => {
  try {
    window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(request))
  } catch {
    return
  }
}

export const ForgotPasswordForm: React.FC = () => {
  const { config, getEntityConfig } = useConfig()

  const {
    admin: {
      routes: { login: loginRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute, api: apiRoute },
  } = config

  const { t } = useTranslation()
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [resendDelay, setResendDelay] = useState(0)
  const [storedRequest, setStoredRequest] = useState<null | StoredForgotPasswordRequest>(null)
  const resendAvailableAt = useRef(0)
  const submittedIdentifier = useRef<null | string>(null)
  const collectionConfig = getEntityConfig({ collectionSlug: userSlug })
  const loginWithUsername = collectionConfig?.auth?.loginWithUsername
  const minRequestInterval = collectionConfig?.auth?.forgotPassword?.minRequestInterval ?? 15000
  const sessionStorageKey = `payload-forgot-password:${userSlug}`

  useEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(sessionStorageKey)

      if (!storedValue) {
        return
      }

      const parsedValue = JSON.parse(storedValue) as StoredForgotPasswordRequest

      if (
        typeof parsedValue.identifier !== 'string' ||
        typeof parsedValue.resendAvailableAt !== 'number' ||
        parsedValue.resendAvailableAt <= Date.now()
      ) {
        removeStoredRequest(sessionStorageKey)
        return
      }

      submittedIdentifier.current = parsedValue.identifier
      resendAvailableAt.current = parsedValue.resendAvailableAt
      setStoredRequest(parsedValue)
      setResendDelay(Math.max(0, Math.ceil((parsedValue.resendAvailableAt - Date.now()) / 1000)))
      setHasSubmitted(true)
    } catch {
      removeStoredRequest(sessionStorageKey)
    }
  }, [sessionStorageKey])

  useEffect(() => {
    if (resendDelay === 0) {
      return
    }
    const timeout = setTimeout(() => {
      setResendDelay(Math.max(0, Math.ceil((resendAvailableAt.current - Date.now()) / 1000)))
    }, 1050)
    return () => clearTimeout(timeout)
  }, [resendDelay])

  const handleResponse: FormProps['handleResponse'] = (res, successToast, errorToast) => {
    res
      .json()
      .then(() => {
        const nextResendAvailableAt = Date.now() + minRequestInterval
        const nextStoredRequest = submittedIdentifier.current
          ? {
              identifier: submittedIdentifier.current,
              resendAvailableAt: nextResendAvailableAt,
            }
          : null

        resendAvailableAt.current = nextResendAvailableAt
        setResendDelay(Math.ceil(minRequestInterval / 1000))
        setStoredRequest(nextStoredRequest)
        setHasSubmitted(true)

        if (nextStoredRequest) {
          saveStoredRequest({ request: nextStoredRequest, sessionStorageKey })
        }

        successToast(t('general:submissionSuccessful'))
      })
      .catch(() => {
        errorToast(
          loginWithUsername
            ? t('authentication:usernameNotValid')
            : t('authentication:emailNotValid'),
        )
      })
  }

  const initialState: FormState = loginWithUsername
    ? {
        username: {
          initialValue: storedRequest?.identifier ?? '',
          valid: true,
          value: storedRequest?.identifier,
        },
      }
    : {
        email: {
          initialValue: storedRequest?.identifier ?? '',
          valid: true,
          value: storedRequest?.identifier,
        },
      }

  return (
    <Form
      action={formatAdminURL({
        apiRoute,
        path: `/${userSlug}/forgot-password`,
      })}
      className={baseClass}
      handleResponse={handleResponse}
      initialState={initialState}
      key={`${hasSubmitted ? 'submitted' : 'editing'}:${storedRequest?.identifier ?? ''}`}
      method="POST"
      onSubmit={(_, data) => {
        const identifier = loginWithUsername ? data.username : data.email

        submittedIdentifier.current = typeof identifier === 'string' ? identifier : null
      }}
    >
      {hasSubmitted ? (
        <>
          <FormHeader
            description={t('authentication:checkYourEmailForPasswordReset')}
            heading={t('authentication:emailSent')}
          />
          <div className={`${baseClass}__actions`}>
            <Button
              buttonStyle="primary"
              className={`${baseClass}__submit`}
              disabled={resendDelay > 0}
              type="submit"
            >
              {resendDelay > 0
                ? `${t('authentication:resend')} (${formatResendDelay(resendDelay)})`
                : t('authentication:resend')}
            </Button>
            <Link href={formatAdminURL({ adminRoute, path: loginRoute })} prefetch={false}>
              {t('authentication:backToLogin')}
            </Link>
          </div>
        </>
      ) : (
        <>
          <FormHeader
            description={
              loginWithUsername
                ? t('authentication:forgotPasswordUsernameInstructions')
                : t('authentication:forgotPasswordEmailInstructions')
            }
            heading={t('authentication:forgotPassword')}
          />

          <div className={`${baseClass}__inputWrap`}>
            {loginWithUsername ? (
              <TextField
                field={{
                  name: 'username',
                  label: t('authentication:username'),
                  required: true,
                }}
                path="username"
                validate={(value) =>
                  text(value, {
                    name: 'username',
                    type: 'text',
                    blockData: {},
                    data: {},
                    event: 'onChange',
                    path: ['username'],
                    preferences: { fields: {} },
                    req: {
                      payload: {
                        config,
                      },
                      t,
                    } as unknown as PayloadRequest,
                    required: true,
                    siblingData: {},
                  })
                }
              />
            ) : (
              <EmailField
                field={{
                  name: 'email',
                  admin: {
                    autoComplete: 'email',
                  },
                  label: t('general:email'),
                  required: true,
                }}
                path="email"
                validate={(value) =>
                  email(value, {
                    name: 'email',
                    type: 'email',
                    blockData: {},
                    data: {},
                    event: 'onChange',
                    path: ['email'],
                    preferences: { fields: {} },
                    req: { payload: { config }, t } as unknown as PayloadRequest,
                    required: true,
                    siblingData: {},
                  })
                }
              />
            )}
          </div>
          <FormSubmit className={`${baseClass}__submit`}>{t('general:submit')}</FormSubmit>
          <Link
            className="forgot-password__back"
            href={formatAdminURL({ adminRoute, path: loginRoute })}
            prefetch={false}
          >
            {t('authentication:backToLogin')}
          </Link>
        </>
      )}
    </Form>
  )
}
