'use client'
import React, { useRef, useState } from 'react'

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
  const ref = useRef(null)
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { t } = useTranslation()

  if (value) {
    return (
      <button
        className={baseClass}
        onClick={() => {
          if (ref && ref.current) {
            ref.current.select()
            ref.current.setSelectionRange(0, value.length + 1)
            document.execCommand('copy')
            setCopied(true)
          }
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
        <textarea readOnly ref={ref} tabIndex={-1} value={value} />
      </button>
    )
  }

  return null
}
