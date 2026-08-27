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

const useGenerateAPIKey = ({
  onGenerationComplete,
  onGenerationStart,
}: {
  onGenerationComplete?: (updatedAt?: string) => void
  onGenerationStart?: () => void
}) => {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const { id, collectionSlug, setData } = useDocumentInfo()
  const { i18n, t } = useTranslation()

  return useCallback(async (): Promise<{ apiKey?: string; updatedAt?: string }> => {
    onGenerationStart?.()

    let updatedAt: string | undefined

    try {
      if (!id) {
        throw new Error(t('general:error'))
      }

      const response = await fetch(
        formatAdminURL({
          apiRoute: api,
          path: `/${collectionSlug}/generate-api-key/${id}`,
        }),
        {
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

      updatedAt = typeof result.updatedAt === 'string' ? result.updatedAt : undefined

      if (Object.keys(result).length > 0) {
        setData(result)
      }

      return result
    } finally {
      onGenerationComplete?.(updatedAt)
    }
  }, [api, collectionSlug, i18n.language, id, onGenerationComplete, onGenerationStart, setData, t])
}

const APIKeyLabel = ({ label }: { label: string }) => (
  <label className={`${baseClass}__label field-label`} htmlFor="apiKey">
    <span>{label}</span>
  </label>
)

export const UnreadableAPIKey: React.FC<{
  readonly canGenerate: boolean
  readonly description: string
  readonly isPending: boolean
  readonly onGenerationComplete?: (updatedAt?: string) => void
  readonly onGenerationStart?: () => void
}> = ({ canGenerate, description, isPending, onGenerationComplete, onGenerationStart }) => {
  const apiKeyLabel = useAPIKeyLabel()
  const generateAPIKey = useGenerateAPIKey({ onGenerationComplete, onGenerationStart })

  return (
    <React.Fragment>
      <div className={[fieldBaseClass, 'api-key', 'read-only'].join(' ')}>
        <APIKeyLabel label={apiKeyLabel} />
        <APIKeyInput
          aria-label={apiKeyLabel}
          disabled
          id="apiKey"
          isPending={isPending}
          value={undefined}
        />
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
  readonly generateOnEnable: boolean
  readonly isFormModified: boolean
  readonly onGenerated: (apiKey: string) => void
  readonly onGenerationComplete?: (updatedAt?: string) => void
  readonly onGenerationStart?: () => void
  readonly value?: string
}> = ({
  canGenerate,
  description,
  enabled,
  generateOnEnable,
  isFormModified,
  onGenerated,
  onGenerationComplete,
  onGenerationStart,
  value,
}) => {
  const [highlightedField, setHighlightedField] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const hasGeneratedOnEnable = useRef(false)
  const apiKeyLabel = useAPIKeyLabel()
  const generateAPIKey = useGenerateAPIKey({ onGenerationComplete, onGenerationStart })
  const { t } = useTranslation()

  useEffect(() => {
    if (highlightedField) {
      const timeout = setTimeout(() => {
        setHighlightedField(false)
      }, 10000)

      return () => clearTimeout(timeout)
    }
  }, [highlightedField])

  const generate = useCallback(async () => {
    setIsGenerating(true)

    try {
      const result = await generateAPIKey()

      if (result.apiKey) {
        onGenerated(result.apiKey)
        setHighlightedField(true)
      }
    } finally {
      setIsGenerating(false)
    }
  }, [generateAPIKey, onGenerated])

  useEffect(() => {
    if (!enabled || !generateOnEnable || hasGeneratedOnEnable.current || value) {
      return
    }

    hasGeneratedOnEnable.current = true
    void generate().catch((error) => {
      hasGeneratedOnEnable.current = false
      toast.error(error instanceof Error ? error.message : t('general:error'))
    })
  }, [enabled, generate, generateOnEnable, t, value])

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
          isLoading={isGenerating}
          isPending={!value}
          value={value}
        />
        <FieldDescription description={description} path="apiKey" />
      </div>
      {canGenerate && <GenerateConfirmation generate={generate} />}
    </React.Fragment>
  )
}
