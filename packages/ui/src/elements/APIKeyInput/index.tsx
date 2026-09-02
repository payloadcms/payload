'use client'
import React, { useState } from 'react'

import { EyeIcon } from '../../icons/Eye/index.js'
import { KeyIcon } from '../../icons/Key/index.js'
import { CopyToClipboard } from '../CopyToClipboard/index.js'
import './index.css'

const baseClass = 'api-key-input'

/**
 * Stands in for a secret that exists but cannot be shown - never real data, so always
 * safe to render regardless of whether the viewer could see the real value.
 */
const MASKED_PLACEHOLDER = '•'.repeat(24)

export type APIKeyInputProps = {
  readonly 'aria-label'?: string
  readonly highlighted?: boolean
  readonly id?: string
  readonly value: null | string | undefined
}

/**
 * Read-only masked API key field: key icon, value, show/hide toggle, and copy
 * control. Shared by the core auth API-key field and the MCP API-keys collection.
 *
 * The raw secret is only ever available in the response of the request that generated
 * it, so a falsy `value` renders a fixed placeholder mask instead of an empty input -
 * there is no real value underneath it to reveal or copy, so the toggle and copy
 * controls are omitted in that state.
 */
export const APIKeyInput: React.FC<APIKeyInputProps> = ({
  id,
  'aria-label': ariaLabel = 'API Key',
  highlighted,
  value,
}) => {
  const [showKey, setShowKey] = useState(false)
  const hasValue = Boolean(value)

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
          type={hasValue && !showKey ? 'password' : 'text'}
          value={hasValue ? value : MASKED_PLACEHOLDER}
        />
        {hasValue && (
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
      {hasValue && <CopyToClipboard value={value} />}
    </div>
  )
}
