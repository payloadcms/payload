'use client'
import React, { useState } from 'react'

import { EyeIcon } from '../../icons/Eye/index.js'
import { KeyIcon } from '../../icons/Key/index.js'
import { CopyToClipboard } from '../CopyToClipboard/index.js'
import './index.css'

const baseClass = 'api-key-input'

export type APIKeyInputProps = {
  readonly 'aria-label'?: string
  readonly highlighted?: boolean
  readonly id?: string
  readonly value: null | string | undefined
}

/**
 * Read-only masked API key field: key icon, value, show/hide toggle, and copy
 * control. Shared by the core auth API-key field and the MCP API-keys collection.
 */
export const APIKeyInput: React.FC<APIKeyInputProps> = ({
  'aria-label': ariaLabel = 'API Key',
  highlighted,
  id,
  value,
}) => {
  const [showKey, setShowKey] = useState(false)
  const keyValue = value ?? ''

  return (
    <div className={baseClass}>
      <div
        className={[`${baseClass}__control`, highlighted && 'highlight'].filter(Boolean).join(' ')}
      >
        <KeyIcon className={`${baseClass}__icon`} />
        <input
          aria-label={ariaLabel}
          className={`${baseClass}__field`}
          id={id}
          readOnly
          type={showKey ? 'text' : 'password'}
          value={keyValue}
        />
        <button
          aria-label={showKey ? 'Hide API key' : 'Show API key'}
          className={`${baseClass}__toggle`}
          onClick={() => setShowKey((prev) => !prev)}
          type="button"
        >
          <EyeIcon active={showKey} size={24} />
        </button>
      </div>
      <CopyToClipboard value={keyValue} />
    </div>
  )
}
