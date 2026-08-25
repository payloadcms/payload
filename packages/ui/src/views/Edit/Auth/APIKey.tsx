'use client'
import type { PayloadRequest, TextFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { text } from 'payload/shared'
import React, { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { APIKeyInput } from '../../../elements/APIKeyInput/index.js'
import { GenerateConfirmation } from '../../../elements/GenerateConfirmation/index.js'
import { FieldDescription } from '../../../fields/FieldDescription/index.js'
import { useForm, useFormFields } from '../../../forms/Form/context.js'
import { useField } from '../../../forms/useField/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

const path = 'apiKey'
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

const APIKeyLabel = ({ label }: { label: string }) => (
  <label className={`${baseClass}__label field-label`} htmlFor="apiKey">
    <span>{label}</span>
  </label>
)

export const UnreadableAPIKey: React.FC<{
  readonly canModify: boolean
  readonly description: string
}> = ({ canModify, description }) => {
  const apiKeyLabel = useAPIKeyLabel()
  const dispatchFields = useFormFields((reducer) => reducer[1])
  const { setModified } = useForm()

  const generateAPIKey = () => {
    dispatchFields({ type: 'UPDATE', path, value: uuidv4() })
    setModified(true)
  }

  return (
    <React.Fragment>
      <div className={[fieldBaseClass, 'api-key', 'read-only'].join(' ')}>
        <APIKeyLabel label={apiKeyLabel} />
        <APIKeyInput aria-label={apiKeyLabel} disabled id="apiKey" value={undefined} />
        <FieldDescription description={description} path="apiKey" />
      </div>
      {canModify && <GenerateConfirmation setKey={generateAPIKey} />}
    </React.Fragment>
  )
}

export const APIKey: React.FC<{
  readonly description?: string
  readonly enabled: boolean
  readonly readOnly?: boolean
}> = ({ description, enabled, readOnly }) => {
  const [initialAPIKey] = useState(uuidv4())
  const [highlightedField, setHighlightedField] = useState(false)
  const { t } = useTranslation()
  const { config } = useConfig()
  const apiKeyLabel = useAPIKeyLabel()

  const apiKey = useFormFields(([fields]) => (fields && fields[path]) || null)

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
      req: {
        payload: {
          config,
        },
        t,
      } as unknown as PayloadRequest,
      siblingData: {},
    })

  const apiKeyValue = apiKey?.value

  const fieldType = useField({
    path: 'apiKey',
    validate,
  })

  const highlightField = () => {
    if (highlightedField) {
      setHighlightedField(false)
    }
    setTimeout(() => {
      setHighlightedField(true)
    }, 1)
  }

  const { setValue, value } = fieldType

  useEffect(() => {
    if (!apiKeyValue && enabled) {
      setValue(initialAPIKey)
    }
    if (!enabled && apiKeyValue) {
      setValue(null)
    }
  }, [apiKeyValue, enabled, setValue, initialAPIKey])

  useEffect(() => {
    if (highlightedField) {
      setTimeout(() => {
        setHighlightedField(false)
      }, 10000)
    }
  }, [highlightedField])

  if (!enabled) {
    return null
  }

  return (
    <React.Fragment>
      <div className={[fieldBaseClass, 'api-key', 'read-only'].filter(Boolean).join(' ')}>
        <APIKeyLabel label={apiKeyLabel} />
        <APIKeyInput
          aria-label={apiKeyLabel}
          highlighted={highlightedField}
          id="apiKey"
          value={value as string}
        />
        <FieldDescription description={description} path="apiKey" />
      </div>
      {!readOnly && (
        <GenerateConfirmation highlightField={highlightField} setKey={() => setValue(uuidv4())} />
      )}
    </React.Fragment>
  )
}
