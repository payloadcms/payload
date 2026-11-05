'use client'
import React, { useState } from 'react'

import { CopyIcon } from '../../icons/Copy/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Tooltip } from '../Tooltip/index.js'
import './index.css'

const baseClass = 'copy-to-clipboard'

export type Props = {
  defaultMessage?: string
  icon?: React.ReactNode
  successMessage?: string
  value?: string
}

export const CopyToClipboard: React.FC<Props> = ({
  defaultMessage,
  icon,
  successMessage,
  value,
}) => {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { t } = useTranslation()
  const copyLabel = defaultMessage ?? t('general:copy')

  if (value) {
    return (
      <button
        aria-label={copyLabel}
        className={baseClass}
        onClick={async () => {
          await navigator.clipboard.writeText(value)
          setCopied(true)
        }}
        onMouseEnter={() => {
          setHovered(true)
          setCopied(false)
        }}
        onMouseLeave={() => {
          setHovered(false)
          setCopied(false)
        }}
        type="button"
      >
        {icon ?? <CopyIcon />}
        <Tooltip delay={copied ? 0 : undefined} show={hovered || copied}>
          {copied && (successMessage ?? t('general:copied'))}
          {!copied && copyLabel}
        </Tooltip>
      </button>
    )
  }

  return null
}
