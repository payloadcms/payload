'use client'
import React, { useEffect, useRef, useState } from 'react'

import { useIsCompiling } from '../../providers/DevCompileStatus/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import {
  applyHideTimeout,
  applyIsCompilingChange,
  createInitialCompileIndicatorState,
} from './timeline.js'
import './index.css'

const baseClass = 'dev-compiling-indicator'
// The minimum time the compiling indicator should be shown, to avoid flicker on fast rebuilds
const minimumVisibleMs = 1000

export const DevCompilingIndicator: React.FC = () => {
  const isCompiling = useIsCompiling()
  const { t } = useTranslation()

  const [state, setState] = useState(createInitialCompileIndicatorState)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setState((previousState) => {
      const nextState = applyIsCompilingChange({
        isCompiling,
        minimumVisibleMs,
        now: Date.now(),
        state: previousState,
      })

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }

      if (nextState.hideAt !== null) {
        const delay = nextState.hideAt - Date.now()
        hideTimeoutRef.current = setTimeout(() => {
          setState((currentState) => applyHideTimeout({ now: Date.now(), state: currentState }))
        }, delay)
      }

      return nextState
    })
  }, [isCompiling])

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  if (!state.visible) {
    return null
  }

  return <div className={baseClass}>{t('general:compiling')}</div>
}
