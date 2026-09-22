'use client'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { APIKeyInput } from '../../../elements/APIKeyInput/index.js'
import { GenerateConfirmation } from '../../../elements/GenerateConfirmation/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { requests } from '../../../utilities/api.js'
import { holdRevealedAPIKey, takeRevealedAPIKey } from './revealedAPIKeys.js'

const baseClass = 'api-key'
const fieldBaseClass = 'field-type'

/**
 * An API key is stored as a one-way hash, so it can only be shown in the response of the
 * request that created it - a save that switched API keys on, or the generate endpoint.
 * Every other render shows that a key is set, without a value.
 */
export const APIKey: React.FC<{ readonly enabled: boolean; readonly readOnly?: boolean }> = ({
  enabled,
  readOnly,
}) => {
  const { i18n, t } = useTranslation()
  const {
    id,
    collectionSlug,
    savedDocumentData,
    updateSavedDocumentData: setSavedDocumentData,
  } = useDocumentInfo()
  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
  } = useConfig()

  const [revealedAPIKey, setRevealedAPIKey] = useState<string | undefined>()

  // A saved key reads back masked, so the value form state holds and submits means "leave
  // the key alone" - the Admin Panel never has to keep the field out of a save.
  const apiKeyFromSave = useMemo(() => {
    const value = (savedDocumentData as Record<string, unknown> | undefined)?.apiKey

    return typeof value === 'string' && value.length > 0 ? value : undefined
  }, [savedDocumentData])

  // A save that generated a key returns it once. Creating redirects to the new document, so
  // the value is handed over to the screen that lands there - the only case that needs it.
  useEffect(() => {
    if (apiKeyFromSave) {
      setRevealedAPIKey(apiKeyFromSave)

      if (!id) {
        holdRevealedAPIKey({
          id: (savedDocumentData as Record<string, unknown> | undefined)?.id as
            | number
            | string
            | undefined,
          apiKey: apiKeyFromSave,
          collectionSlug,
        })
      }
    }
  }, [apiKeyFromSave, collectionSlug, id, savedDocumentData])

  useEffect(() => {
    if (!revealedAPIKey && id) {
      const handedOff = takeRevealedAPIKey({ id, collectionSlug })

      if (handedOff) {
        setRevealedAPIKey(handedOff)
      }
    }
  }, [collectionSlug, id, revealedAPIKey])

  const generateAPIKey = useCallback(async () => {
    try {
      const response = await requests.post(
        formatAdminURL({ apiRoute, path: `/${collectionSlug}/${id}/api-key`, serverURL }),
        {
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
          },
        },
      )

      const { apiKey, doc, errors, message } = await response.json()

      if (response.status >= 400 || !apiKey) {
        toast.error(errors?.[0]?.message || message || t('error:unspecific'))
        return
      }

      setRevealedAPIKey(apiKey)

      // Generation happens outside the form's own save, and has already been persisted, so
      // only the record of what is currently saved needs updating - touching form state
      // would mark the form modified for a change that was never unsaved.
      if (doc && typeof setSavedDocumentData === 'function') {
        void setSavedDocumentData(doc)
      }

      toast.success(t('authentication:newAPIKeyGenerated'))
    } catch (_error) {
      toast.error(t('error:unspecific'))
    }
  }, [apiRoute, collectionSlug, i18n.language, id, serverURL, setSavedDocumentData, t])

  if (!enabled) {
    return null
  }

  return (
    <React.Fragment>
      <div className={[fieldBaseClass, baseClass, 'read-only'].filter(Boolean).join(' ')}>
        <label className={`${baseClass}__label field-label`} htmlFor="apiKey">
          <span>{t('authentication:apiKey')}</span>
        </label>
        {revealedAPIKey ? (
          <React.Fragment>
            <APIKeyInput
              aria-label={t('authentication:apiKey')}
              highlighted
              id="apiKey"
              value={revealedAPIKey}
            />
            <p className={`${baseClass}__reveal-note`} id="apiKey-reveal-note">
              {t('authentication:copyAPIKeyNow')}
            </p>
          </React.Fragment>
        ) : (
          <p className={`${baseClass}__hidden-note`} id="apiKey-hidden-note">
            {id ? t('authentication:apiKeyIsHidden') : t('authentication:apiKeyGeneratedOnSave')}
          </p>
        )}
      </div>
      {!readOnly && id ? <GenerateConfirmation onGenerate={generateAPIKey} /> : null}
    </React.Fragment>
  )
}
