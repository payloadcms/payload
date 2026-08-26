'use client'
import type { TextFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { APIKeyInput } from '../../../elements/APIKeyInput/index.js'
import { GenerateConfirmation } from '../../../elements/GenerateConfirmation/index.js'
import { FieldDescription } from '../../../fields/FieldDescription/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

const baseClass = 'api-key'
const fieldBaseClass = 'field-type'

const useAPIKeyLabel = () => {
  const { i18n } = useTranslation()
  const { getEntityConfig } = useConfig()
  const { collectionSlug } = useDocumentInfo()
  const apiKeyField: TextFieldClient = getEntityConfig({ collectionSlug })?.fields?.find(
    (field) => 'name' in field && field.name === 'apiKey',
  ) as TextFieldClient

  return useMemo(() => {
    let label: Record<string, string> | string = 'API Key'

    if (apiKeyField?.label) {
      label = apiKeyField.label
    }

    return getTranslation(label, i18n)
  }, [apiKeyField, i18n])
}

const useGenerateAPIKey = () => {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const { id, collectionSlug, setData } = useDocumentInfo()
  const { i18n, t } = useTranslation()

  return useCallback(
    async ({ generateIfMissing = false } = {}): Promise<{ apiKey?: string }> => {
      if (!id) {
        throw new Error(t('general:error'))
      }

      const response = await fetch(
        formatAdminURL({
          apiRoute: api,
          path: `/${collectionSlug}/generate-api-key/${id}`,
        }),
        {
          body: generateIfMissing ? JSON.stringify({ generateIfMissing: true }) : undefined,
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
          },
          method: 'post',
        },
      )
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.errors?.[0]?.message ?? t('general:error'))
      }

      setData(result)

      return result
    },
    [api, collectionSlug, i18n.language, id, setData, t],
  )
}

const APIKeyLabel = ({ label }: { label: string }) => (
  <label className={`${baseClass}__label field-label`} htmlFor="apiKey">
    <span>{label}</span>
  </label>
)

export const UnreadableAPIKey: React.FC<{
  readonly canGenerate: boolean
  readonly description: string
}> = ({ canGenerate, description }) => {
  const apiKeyLabel = useAPIKeyLabel()
  const generateAPIKey = useGenerateAPIKey()

  return (
    <React.Fragment>
      <div className={[fieldBaseClass, 'api-key', 'read-only'].join(' ')}>
        <APIKeyLabel label={apiKeyLabel} />
        <APIKeyInput aria-label={apiKeyLabel} disabled id="apiKey" value={undefined} />
        <FieldDescription description={description} path="apiKey" />
      </div>
      {canGenerate && <GenerateConfirmation generate={async () => void (await generateAPIKey())} />}
    </React.Fragment>
  )
}

export const APIKey: React.FC<{
  readonly canGenerate: boolean
  readonly description?: string
  readonly enabled: boolean
  readonly generateIfMissing: boolean
  readonly isFormModified: boolean
  readonly onGenerated: (apiKey: string) => void
  readonly value?: string
}> = ({
  canGenerate,
  description,
  enabled,
  generateIfMissing,
  isFormModified,
  onGenerated,
  value,
}) => {
  const [highlightedField, setHighlightedField] = useState(false)
  const requestedMissingKey = useRef(false)
  const apiKeyLabel = useAPIKeyLabel()
  const generateAPIKey = useGenerateAPIKey()

  useEffect(() => {
    if (highlightedField) {
      const timeout = setTimeout(() => {
        setHighlightedField(false)
      }, 10000)

      return () => clearTimeout(timeout)
    }
  }, [highlightedField])

  const generate = useCallback(async () => {
    const result = await generateAPIKey()

    if (result.apiKey) {
      onGenerated(result.apiKey)
      setHighlightedField(true)
    }
  }, [generateAPIKey, onGenerated])

  useEffect(() => {
    if (!generateIfMissing) {
      requestedMissingKey.current = false
      return
    }

    if (value || requestedMissingKey.current) {
      return
    }

    requestedMissingKey.current = true

    void generateAPIKey({ generateIfMissing: true })
      .then((result) => {
        if (result.apiKey) {
          onGenerated(result.apiKey)
          setHighlightedField(true)
        }
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Error')
      })
  }, [generateAPIKey, generateIfMissing, onGenerated, value])

  if (!enabled) {
    return null
  }

  return (
    <React.Fragment>
      <div className={[fieldBaseClass, 'api-key', 'read-only'].join(' ')}>
        <APIKeyLabel label={apiKeyLabel} />
        <APIKeyInput
          aria-label={apiKeyLabel}
          disabled={!value}
          highlighted={highlightedField}
          id="apiKey"
          isFormModified={isFormModified}
          value={value}
        />
        <FieldDescription description={description} path="apiKey" />
      </div>
      {canGenerate && <GenerateConfirmation generate={generate} />}
    </React.Fragment>
  )
}
