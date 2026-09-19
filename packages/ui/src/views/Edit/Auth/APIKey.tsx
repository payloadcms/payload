'use client'
import type { PayloadRequest, TextFieldClient } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL, text } from 'payload/shared'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

import { Button } from '../../../elements/Button/index.js'
import { ConfirmationModal } from '../../../elements/ConfirmationModal/index.js'
import { CopyToClipboard } from '../../../elements/CopyToClipboard/index.js'
import { Spinner } from '../../../elements/Spinner/index.js'
import { FieldDescription } from '../../../fields/FieldDescription/index.js'
import { useFormFields, useFormSuccessfulSubmitCount } from '../../../forms/Form/context.js'
import { useField } from '../../../forms/useField/index.js'
import { EyeIcon } from '../../../icons/Eye/index.js'
import { RefreshIcon } from '../../../icons/Refresh/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { APIKeyGenerationModal } from './APIKeyGenerationModal.js'

const path = 'apiKey'
const baseClass = 'api-key'
const maskedCharacterCount = 20

const formatAPIKeyPreview = (last4: string): string => `${'•'.repeat(maskedCharacterCount)}${last4}`

export const APIKey: React.FC<{ readonly readOnly?: boolean; readonly reveal?: boolean }> = ({
  readOnly,
  reveal,
}) => {
  const [generatedAtSubmitCount, setGeneratedAtSubmitCount] = useState<null | number>(null)
  const [highlightedField, setHighlightedField] = useState(false)
  const [hasUpdatedPersistedAPIKey, setHasUpdatedPersistedAPIKey] = useState<boolean | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)
  const [revealedKey, setRevealedKey] = useState<null | string>(null)
  const [showCopyWarning, setShowCopyWarning] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const successfulSubmitCount = useFormSuccessfulSubmitCount()
  const { i18n, t } = useTranslation()
  const { toggleModal } = useModal()
  const { config, getEntityConfig } = useConfig()
  const { id, collectionSlug, setData, setLastUpdateTime } = useDocumentInfo()
  const locale = useLocale()
  const revokeModalSlug = `revoke-api-key-${id}`

  const apiKeyLast4 = useFormFields(([fields]) => (fields && fields.apiKeyLast4) || null)
  const dispatchFields = useFormFields(([, dispatch]) => dispatch)
  const apiKeyField = getEntityConfig({ collectionSlug })?.fields?.find(
    (field) => 'name' in field && field.name === 'apiKey',
  ) as TextFieldClient
  const validate = (val) =>
    text(val, {
      name: 'apiKey',
      type: 'text',
      blockData: {},
      data: {},
      event: 'onChange',
      maxLength: 48,
      minLength: 24,
      path: ['apiKey'],
      preferences: { fields: {} },
      req: { payload: { config }, t } as unknown as PayloadRequest,
      siblingData: {},
    })
  const { setValue, value } = useField({ path, validate })
  const { setValue: setLast4Value } = useField({ path: 'apiKeyLast4' })
  const apiKeyValue = revealedKey || (value as null | string | undefined)
  const last4Value = apiKeyLast4?.value as null | string | undefined
  const hasPersistedAPIKey = hasUpdatedPersistedAPIKey ?? Boolean(last4Value)
  const canRevealPersistedAPIKey = Boolean(reveal && hasPersistedAPIKey && !revealedKey)

  const apiKeyLabel = useMemo(
    () => getTranslation(apiKeyField?.label || 'API Key', i18n),
    [apiKeyField, i18n],
  )
  const highlightField = () => setHighlightedField(true)

  const updateKey = async (apiKey: null | string) => {
    if (!id) {
      return false
    }
    try {
      const searchParams = new URLSearchParams({ depth: '0', 'fallback-locale': 'null' })
      if (locale?.code) {
        searchParams.set('locale', locale.code)
      }
      const response = await fetch(
        formatAdminURL({
          apiRoute: config.routes.api,
          path: `/${collectionSlug}/${encodeURIComponent(String(id))}?${searchParams}`,
        }),
        {
          body: JSON.stringify({ apiKey }),
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        },
      )
      if (!response.ok) {
        throw new Error('API key update failed')
      }
      const result = await response.json()
      setHasUpdatedPersistedAPIKey(Boolean(apiKey))
      setLast4Value(result.doc?.apiKeyLast4 || null, true)
      dispatchFields({ type: 'REMOVE', path })
      if (result.doc?.updatedAt) {
        setData(result.doc)
        setLastUpdateTime(new Date(result.doc.updatedAt).getTime())
      }
      return true
    } catch {
      toast.error('Failed to update the API key.')
      return false
    }
  }

  const generateKey = async () => {
    const key = uuidv4()
    if (!id) {
      setValue(key, true)
    } else if (!(await updateKey(key))) {
      return false
    } else {
      setRevealedKey(key)
    }
    setGeneratedAtSubmitCount(successfulSubmitCount)
    setShowCopyWarning(true)
    setShowKey(true)
    highlightField()
    return true
  }

  const revokeKey = async () => {
    if (!(await updateKey(null))) {
      return
    }
    setRevealedKey(null)
    setHasUpdatedPersistedAPIKey(false)
    setHighlightedField(false)
    setShowCopyWarning(false)
    setShowKey(false)
    toast.success('API key revoked successfully.')
  }

  const revealKey = async () => {
    if (isRevealing) {
      return
    }
    setIsRevealing(true)
    try {
      const response = await fetch(
        formatAdminURL({
          apiRoute: config.routes.api,
          path: `/${collectionSlug}/${encodeURIComponent(String(id))}/api-key/reveal`,
        }),
        { method: 'POST' },
      )
      if (!response.ok) {
        throw new Error('API key reveal failed')
      }
      const result = await response.json()
      setRevealedKey(result.apiKey)
      setShowCopyWarning(false)
      setShowKey(true)
    } catch {
      toast.error('Failed to reveal the API key.')
    } finally {
      setIsRevealing(false)
    }
  }

  useEffect(() => {
    if (
      generatedAtSubmitCount !== null &&
      successfulSubmitCount > generatedAtSubmitCount &&
      apiKeyValue
    ) {
      setHasUpdatedPersistedAPIKey(true)
      setHighlightedField(false)
      setGeneratedAtSubmitCount(null)
      setRevealedKey(null)
      setShowCopyWarning(false)
      dispatchFields({ type: 'REMOVE', path })
      setShowKey(false)
    }
  }, [apiKeyValue, dispatchFields, generatedAtSubmitCount, successfulSubmitCount])

  return (
    <React.Fragment>
      <div className="field-type api-key read-only">
        <label className={`${baseClass}__label field-label`} htmlFor="apiKey">
          <span>{apiKeyLabel}</span>
          {apiKeyValue && <CopyToClipboard value={apiKeyValue} />}
        </label>
        <div
          className={[
            `${baseClass}__input-wrap`,
            !readOnly && hasPersistedAPIKey && `${baseClass}__input-wrap--has-regenerate`,
            highlightedField && `${baseClass}__input-wrap--highlighted`,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            aria-label={apiKeyLabel}
            disabled
            id="apiKey"
            name="apiKey"
            type={apiKeyValue && !showKey ? 'password' : 'text'}
            value={apiKeyValue || (last4Value ? formatAPIKeyPreview(last4Value) : '')}
          />
          {(apiKeyValue || canRevealPersistedAPIKey || (!readOnly && hasPersistedAPIKey)) && (
            <div className={`${baseClass}__toggle-button-wrap`}>
              {(apiKeyValue || canRevealPersistedAPIKey) && (
                <Button
                  aria-label={
                    canRevealPersistedAPIKey ? 'Reveal API key' : 'Toggle API key visibility'
                  }
                  buttonStyle="ghost"
                  className={`${baseClass}__visibility-button${!readOnly && hasPersistedAPIKey ? ` ${baseClass}__visibility-button--with-regenerate` : ''}`}
                  disabled={isRevealing}
                  extraButtonProps={{ 'aria-busy': isRevealing }}
                  icon={
                    isRevealing ? (
                      <Spinner loadingText={null} size="sm" />
                    ) : (
                      <EyeIcon active={showKey} />
                    )
                  }
                  id={canRevealPersistedAPIKey ? 'reveal-api-key' : 'toggle-api-key-visibility'}
                  onClick={
                    canRevealPersistedAPIKey ? revealKey : () => setShowKey((shown) => !shown)
                  }
                />
              )}
              {!readOnly && hasPersistedAPIKey && (
                <APIKeyGenerationModal
                  apiKeyLast4={last4Value}
                  highlightField={highlightField}
                  icon={<RefreshIcon />}
                  id="regenerate-api-key"
                  setKey={generateKey}
                />
              )}
            </div>
          )}
        </div>
        {apiKeyValue && showCopyWarning && (
          <FieldDescription
            description={
              reveal
                ? 'Make sure to copy your API key. You may not have access to reveal it again.'
                : 'Make sure to copy your API key. It will not be displayed again.'
            }
            path={path}
          />
        )}
      </div>
      {!readOnly &&
        !apiKeyValue &&
        !hasPersistedAPIKey &&
        (id ? (
          <APIKeyGenerationModal
            highlightField={highlightField}
            id="generate-api-key"
            setKey={generateKey}
            willInvalidateExistingKey={false}
          />
        ) : (
          <Button
            buttonStyle="secondary"
            id="generate-api-key"
            onClick={() => void generateKey()}
            size="medium"
          >
            {t('authentication:generateNewAPIKey')}
          </Button>
        ))}
      {!readOnly && hasPersistedAPIKey && (
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="secondary"
            className={`${baseClass}__revoke-button`}
            id="revoke-api-key"
            onClick={() => toggleModal(revokeModalSlug)}
            size="medium"
          >
            Revoke API key
          </Button>
          <ConfirmationModal
            body={
              <span>
                Are you sure you want to revoke the API key ending in <strong>{last4Value}</strong>{' '}
                for user <strong>{id}</strong>? The key will no longer be usable, and this action
                cannot be undone.
              </span>
            }
            confirmLabel="Revoke"
            heading="Revoke API key?"
            modalSlug={revokeModalSlug}
            onConfirm={revokeKey}
          />
        </div>
      )}
    </React.Fragment>
  )
}
