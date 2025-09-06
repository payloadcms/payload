'use client'
import React, { useState } from 'react'

import { CopyIcon } from '../../icons/Copy/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Tooltip } from '../Tooltip/index.js'
import './index.scss'

const baseClass = 'copy-to-clipboard'

export type Props = {
  defaultMessage?: string
  successMessage?: string
  value?: string
}

export const CopyToClipboard: React.FC<Props> = ({ defaultMessage, successMessage, value }) => {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { t } = useTranslation()

  if (value) {
    return (
      <button
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
        <CopyIcon />
        <Tooltip delay={copied ? 0 : undefined} show={hovered || copied}>
          {copied && (successMessage ?? t('general:copied'))}
          {!copied && (defaultMessage ?? t('general:copy'))}
        </Tooltip>
      </button>
    )
  }

  return null
}
