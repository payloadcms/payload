'use client'

import { APIKeyInput, Button, useField, WarningTriangleIcon } from '@payloadcms/ui'
import React, { useState } from 'react'

import './index.css'

const baseClass = 'mcp-api-key-field'

/**
 * Replaces the hidden built-in `apiKey` / `enableAPIKey` auth fields with the
 * panel from the MCP design:
 * - no key yet: a "Generate new key" button
 * - key set: a dismissible privacy warning + the shared masked-key input
 */
export const APIKeyField: React.FC = () => {
  const { setValue: setApiKey, value: apiKey } = useField<string>({ path: 'apiKey' })
  const { setValue: setEnableAPIKey } = useField<boolean>({ path: 'enableAPIKey' })
  const [isWarningDismissed, setIsWarningDismissed] = useState(false)

  const generateKey = () => {
    setApiKey(crypto.randomUUID())
    setEnableAPIKey(true)
    setIsWarningDismissed(false)
  }

  return (
    <div className={baseClass}>
      {/* TODO: needs i18n once design is finalized */}
      <p className={`${baseClass}__description`}>
        API keys control which collections, resources, tools, and prompts MCP clients can access.
      </p>
      <div className={`${baseClass}__panel`}>
        <div className={`${baseClass}__header`}>
          {/* TODO: needs i18n once design is finalized */}
          <span className={`${baseClass}__title`}>API key</span>
          {!apiKey && (
            // TODO: needs i18n once design is finalized
            <Button
              buttonStyle="primary"
              className={`${baseClass}__generate`}
              onClick={generateKey}
            >
              Generate new key
            </Button>
          )}
        </div>
        {Boolean(apiKey) && (
          <div className={`${baseClass}__body`}>
            {!isWarningDismissed && (
              <div className={`${baseClass}__warning`}>
                <WarningTriangleIcon className={`${baseClass}__warning-icon`} />
                {/* TODO: needs i18n once design is finalized */}
                <p className={`${baseClass}__warning-text`}>
                  <strong>Keep your key private.</strong>
                  {' This key is what gives MCP access to your content. Don’t share it with others!'}
                </p>
                <button
                  aria-label="Dismiss"
                  className={`${baseClass}__warning-dismiss`}
                  onClick={() => setIsWarningDismissed(true)}
                  type="button"
                >
                  &times;
                </button>
              </div>
            )}
            <APIKeyInput aria-label="API key" value={apiKey} />
          </div>
        )}
      </div>
    </div>
  )
}
