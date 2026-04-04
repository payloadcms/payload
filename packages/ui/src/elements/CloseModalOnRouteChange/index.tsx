'use client'

import { useModal } from '@faceless-ui/modal'
import { useEffect, useRef } from 'react'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { usePathname } from '../../providers/RouterAdapter/index.js'

export function CloseModalOnRouteChange() {
  const { closeAllModals } = useModal()
  const pathname = usePathname()

  const closeAllModalsEffectEvent = useEffectEvent(() => {
    closeAllModals()
  })

  const initialRenderRef = useRef(true)

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      return
    }

    closeAllModalsEffectEvent()
  }, [pathname])

  return null
}
