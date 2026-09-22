'use client'
import type { TextFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { APIKeyInput } from '../../../elements/APIKeyInput/index.js'
import { GenerateConfirmation } from '../../../elements/GenerateConfirmation/index.js'
import { useFormFields } from '../../../forms/Form/context.js'
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
    getEntityConfig,
  } = useConfig()
  const dispatchFields = useFormFields((reducer) => reducer[1])

  const [revealedAPIKey, setRevealedAPIKey] = useState<string | undefined>()

  const maskAPIKeyInForm = useCallback(() => {
    dispatchFields({
      type: 'UPDATE',
      initialValue: '',
      path: 'apiKey',
      value: '',
    })
  }, [dispatchFields])

  const apiKeyField = getEntityConfig({ collectionSlug })?.fields?.find(
    (field) => 'name' in field && field.name === 'apiKey',
  ) as TextFieldClient | undefined

  const apiKeyLabel = useMemo(
    () => getTranslation(apiKeyField?.label ?? 'API Key', i18n),
    [apiKeyField?.label, i18n],
  )

  // A saved key reads back masked, so the value form state holds and submits means "leave
  // the key alone" - the Admin Panel never has to keep the field out of a save.
  const apiKeyFromSave = useMemo(() => {
    const value = (savedDocumentData as Record<string, unknown> | undefined)?.apiKey

    return typeof value === 'string' && value.length > 0 ? value : undefined
  }, [savedDocumentData])

  // A save that generated a key returns it once. Creating redirects to the new document, so
  // the value is handed over to the screen that lands there - the only case that needs it.
  useEffect(() => {
    if (!enabled) {
      setRevealedAPIKey(undefined)
      return
    }

    if (apiKeyFromSave) {
      if (id) {
        takeRevealedAPIKey({ id, collectionSlug })
      }

      setRevealedAPIKey(apiKeyFromSave)
      maskAPIKeyInForm()

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
  }, [apiKeyFromSave, collectionSlug, enabled, id, maskAPIKeyInForm, savedDocumentData])

  useEffect(() => {
    if (enabled && !revealedAPIKey && id) {
      const handedOff = takeRevealedAPIKey({ id, collectionSlug })

      if (handedOff) {
        setRevealedAPIKey(handedOff)
      }
    }
  }, [collectionSlug, enabled, id, revealedAPIKey])

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
      maskAPIKeyInForm()

      // Generation happens outside the form's own save, and has already been persisted, so
      // update the saved record without changing whether the form has other unsaved work.
      if (doc && typeof setSavedDocumentData === 'function') {
        void setSavedDocumentData(doc)
      }

      toast.success(t('authentication:newAPIKeyGenerated'))
    } catch (_error) {
      toast.error(t('error:unspecific'))
    }
  }, [
    apiRoute,
    collectionSlug,
    i18n.language,
    id,
    maskAPIKeyInForm,
    serverURL,
    setSavedDocumentData,
    t,
  ])

  if (!enabled) {
    return null
  }

  return (
    <React.Fragment>
      <div className={[fieldBaseClass, baseClass, 'read-only'].filter(Boolean).join(' ')}>
        <label className={`${baseClass}__label field-label`} htmlFor="apiKey">
          <span>{apiKeyLabel}</span>
        </label>
        {revealedAPIKey ? (
          <React.Fragment>
            <APIKeyInput aria-label={apiKeyLabel} highlighted id="apiKey" value={revealedAPIKey} />
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
