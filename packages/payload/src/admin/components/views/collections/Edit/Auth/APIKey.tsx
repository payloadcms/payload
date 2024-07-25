import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'

import { text } from '../../../../../../fields/validations'
import CopyToClipboard from '../../../../elements/CopyToClipboard'
import GenerateConfirmation from '../../../../elements/GenerateConfirmation'
import { useFormFields } from '../../../../forms/Form/context'
import Label from '../../../../forms/Label'
import { fieldBaseClass } from '../../../../forms/field-types/shared'
import useField from '../../../../forms/useField'

const path = 'apiKey'
const baseClass = 'api-key'

const APIKey: React.FC<{ enabled: boolean; readOnly?: boolean }> = ({ enabled, readOnly }) => {
  const [initialAPIKey] = useState(uuidv4())
  const [highlightedField, setHighlightedField] = useState(false)
  const { t } = useTranslation()

  const apiKey = useFormFields(([fields]) => fields[path])
  const validate = (val) =>
    text(val, { data: {}, maxLength: 48, minLength: 24, siblingData: {}, t })

  const apiKeyValue = apiKey?.value

  const APIKeyLabel = useMemo(
    () => (
      <div className={`${baseClass}__label`}>
        <span>API Key</span>
        <CopyToClipboard value={apiKeyValue as string} />
      </div>
    ),
    [apiKeyValue],
  )

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
    if (!enabled) {
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
        <Label htmlFor={path} label={APIKeyLabel} />
        <input
          className={highlightedField ? 'highlight' : undefined}
          disabled
          id="apiKey"
          name="apiKey"
          type="text"
          value={(value as string) || ''}
        />
      </div>
      {!readOnly && (
        <GenerateConfirmation highlightField={highlightField} setKey={() => setValue(uuidv4())} />
      )}
    </React.Fragment>
  )
}

export default APIKey
