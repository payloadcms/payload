import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import Copy from '../../icons/Copy'
import Tooltip from '../Tooltip'
import './index.scss'

const baseClass = 'copy-to-clipboard'

const CopyToClipboard: React.FC<Props> = ({ defaultMessage, successMessage, value }) => {
  const ref = useRef(null)
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { t } = useTranslation('general')

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
        <Copy />
        <Tooltip delay={copied ? 0 : undefined} show={hovered || copied}>
          {copied && (successMessage ?? t('copied'))}
          {!copied && (defaultMessage ?? t('copy'))}
        </Tooltip>
        <textarea readOnly ref={ref} tabIndex={-1} value={value} />
      </button>
    )
  }

  return null
}

export default CopyToClipboard
