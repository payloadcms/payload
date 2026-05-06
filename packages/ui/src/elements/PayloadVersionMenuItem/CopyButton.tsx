'use client'

import React, { useState } from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Client component imports from same package's client bundle
import { Button, useTranslation } from '../../exports/client/index.js'

export const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable; silently no-op
    }
  }

  return (
    <Button
      buttonStyle="secondary"
      className={`payload-version-menu-item__copy${copied ? ' payload-version-menu-item__copy--copied' : ''}`}
      disabled={!text}
      onClick={() => void handleCopy()}
      type="button"
    >
      {t('general:copy')}
    </Button>
  )
}
