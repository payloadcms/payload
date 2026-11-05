'use client'

import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { useWindowInfo } from '../../providers/WindowInfo/index.js'
import { useNav } from '../Nav/context.js'
import './index.css'

export function SkipToContent() {
  const { t } = useTranslation()
  const { setNavOpen } = useNav()
  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  return (
    <a
      className="skip-to-content"
      href="#payload-main-content"
      onClick={(event) => {
        const content = document.getElementById('payload-main-content')
        const target = content?.parentElement?.querySelector('main') || content

        if (target) {
          event.preventDefault()
          if (smallBreak) {
            setNavOpen(false)
          }
          target.setAttribute('tabindex', '-1')
          target.focus()
          target.scrollIntoView({ block: 'start' })
        }
      }}
    >
      {t('general:skipToContent')}
    </a>
  )
}
