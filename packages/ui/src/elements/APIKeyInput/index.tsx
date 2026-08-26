'use client'
import React, { useEffect, useRef, useState } from 'react'

import { EyeIcon } from '../../icons/Eye/index.js'
import { KeyIcon } from '../../icons/Key/index.js'
import { CopyToClipboard } from '../CopyToClipboard/index.js'
import './index.css'

const baseClass = 'api-key-input'

export type APIKeyInputProps = {
  readonly 'aria-label'?: string
  readonly disabled?: boolean
  readonly highlighted?: boolean
  readonly id?: string
  readonly initiallyVisible?: boolean
  readonly isFormModified?: boolean
  readonly value: null | string | undefined
}

/**
 * Read-only masked API key field: key icon, value, show/hide toggle, and copy
 * control. Shared by the core auth API-key field and the MCP API-keys collection.
 */
export const APIKeyInput: React.FC<APIKeyInputProps> = ({
  id,
  'aria-label': ariaLabel = 'API Key',
  disabled,
  highlighted,
  initiallyVisible = false,
  isFormModified = false,
  value,
}) => {
  const [showKey, setShowKey] = useState(initiallyVisible)
  const wasFormModified = useRef(isFormModified)
  const keyValue = value ?? ''

  useEffect(() => {
    if (highlighted) {
      setShowKey(true)
    }
  }, [highlighted])

  useEffect(() => {
    if (wasFormModified.current && !isFormModified) {
      setShowKey(false)
    }

    wasFormModified.current = isFormModified
  }, [isFormModified])

  return (
    <div className={baseClass}>
      <div
        className={[
          `${baseClass}__control`,
          disabled && `${baseClass}__control--disabled`,
          highlighted && 'highlight',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <KeyIcon className={`${baseClass}__icon`} />
        <input
          aria-label={ariaLabel}
          className={`${baseClass}__field`}
          disabled={disabled}
          id={id}
          placeholder={disabled ? '•'.repeat(36) : undefined}
          readOnly
          type={disabled || showKey ? 'text' : 'password'}
          value={keyValue}
        />
        {!disabled && (
          <button
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
            className={`${baseClass}__toggle`}
            onClick={() => setShowKey((prev) => !prev)}
            type="button"
          >
            <EyeIcon active={showKey} size={24} />
          </button>
        )}
      </div>
      {!disabled && <CopyToClipboard value={keyValue} />}
    </div>
  )
}
