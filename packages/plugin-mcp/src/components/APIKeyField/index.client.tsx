'use client'

import { APIKeyInput, Button, useField, useTranslation, WarningTriangleIcon } from '@payloadcms/ui'
import React, { useState } from 'react'

import type {
  PluginMCPTranslationKeys,
  PluginMCPTranslations,
} from '../../translations/index.js'

import './index.css'

const baseClass = 'mcp-api-key-field'

/**
 * Custom component for the MCP API-keys collection's `apiKey` field:
 * - no key yet: a "Generate new key" button
 * - key set: a dismissible privacy warning + the shared masked-key input
 */
export const APIKeyField: React.FC = () => {
  const { setValue: setApiKey, value: apiKey } = useField<string>({ path: 'apiKey' })
  const { t } = useTranslation<PluginMCPTranslations, PluginMCPTranslationKeys>()
  const [isWarningDismissed, setIsWarningDismissed] = useState(false)

  const generateKey = () => {
    setApiKey(crypto.randomUUID())
    setIsWarningDismissed(false)
  }

  return (
    <div className={baseClass}>
      <p className={`${baseClass}__description`}>
        {t('plugin-mcp:apiKeyDescription')}
      </p>
      <div className={`${baseClass}__panel`}>
        <div className={`${baseClass}__header`}>
          <span className={`${baseClass}__title`}>{t('plugin-mcp:apiKey')}</span>
          {!apiKey && (
            <Button
              buttonStyle="primary"
              className={`${baseClass}__generate`}
              onClick={generateKey}
            >
              {t('plugin-mcp:generateNewKey')}
            </Button>
          )}
        </div>
        {Boolean(apiKey) && (
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
            <APIKeyInput aria-label={t('plugin-mcp:apiKey')} value={apiKey} />
          </div>
        )}
      </div>
    </div>
  )
}
