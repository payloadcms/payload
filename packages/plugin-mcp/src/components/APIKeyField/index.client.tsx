'use client'

import {
  APIKeyInput,
  Button,
  toast,
  useConfig,
  useDocumentInfo,
  useField,
  useForm,
  useTranslation,
  WarningTriangleIcon,
} from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import type { PluginMCPTranslationKeys, PluginMCPTranslations } from '../../translations/index.js'

import { RotateConfirmation } from '../RotateConfirmation/index.client.js'
import './index.css'

const baseClass = 'mcp-api-key-field'

/**
 * Custom component for the MCP API-keys collection's `apiKey` field:
 * - no key yet: a "Generate new key" button
 * - key set: a dismissible privacy warning + the shared masked-key input + rotate
 */
export const APIKeyField: React.FC = () => {
  const { setValue: setApiKey, value: apiKey } = useField<string>({ path: 'apiKey' })
  const { t } = useTranslation<PluginMCPTranslations, PluginMCPTranslationKeys>()
  const [isWarningDismissed, setIsWarningDismissed] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const { config } = useConfig()
  const { id, isEditing } = useDocumentInfo()
  const { setModified } = useForm()

  const handleRotate = useCallback(async () => {
    if (!id) {
      return
    }

    const url = formatAdminURL({
      apiRoute: config.routes.api,
      path: `/payload-mcp-api-keys/${id}/rotate`,
    })

    const res = await fetch(url, { credentials: 'include', method: 'POST' })

    if (!res.ok) {
      toast.error(t('plugin-mcp:errorRotatingAPIKey'))
      throw new Error('Rotate failed')
    }

    const { apiKey: newKey } = (await res.json()) as { apiKey: string }

    setApiKey(newKey)
    setModified(false)
    setIsWarningDismissed(false)
    setHighlighted(true)
    toast.success(t('authentication:newAPIKeyGenerated'))
  }, [config.routes.api, id, setApiKey, setModified, t])

  useEffect(() => {
    if (!highlighted) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setHighlighted(false)
    }, 10000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [highlighted])

  const generateKey = () => {
    setApiKey(crypto.randomUUID())
    setIsWarningDismissed(false)
  }

  return (
    <div className={baseClass}>
      <p className={`${baseClass}__description`}>{t('plugin-mcp:apiKeyDescription')}</p>
      <div className={`${baseClass}__panel`}>
        <div className={`${baseClass}__header`}>
          <span className={`${baseClass}__title`}>{t('authentication:apiKey')}</span>
          {!apiKey && (
            <Button
              buttonStyle="primary"
              className={`${baseClass}__generate`}
              onClick={generateKey}
            >
              {t('authentication:generateNewAPIKey')}
            </Button>
          )}
        </div>
        {Boolean(apiKey) && (
          <>
            <div className={`${baseClass}__body`}>
              {!isWarningDismissed && (
                <div className={`${baseClass}__warning`}>
                  <WarningTriangleIcon className={`${baseClass}__warning-icon`} />
                  <p className={`${baseClass}__warning-text`}>
                    <strong>{t('plugin-mcp:keepKeyPrivate')}</strong>
                    {` ${t('plugin-mcp:keyPrivateDescription')}`}
                  </p>
                  <button
                    aria-label={t('plugin-mcp:dismiss')}
                    className={`${baseClass}__warning-dismiss`}
                    onClick={() => setIsWarningDismissed(true)}
                    type="button"
                  >
                    &times;
                  </button>
                </div>
              )}
              <APIKeyInput
                aria-label={t('authentication:apiKey')}
                highlighted={highlighted}
                value={apiKey}
              />
            </div>
            {isEditing && (
              <div className={`${baseClass}__actions`}>
                <RotateConfirmation className={`${baseClass}__rotate`} onRotate={handleRotate} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
