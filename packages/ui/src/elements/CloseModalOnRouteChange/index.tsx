'use client'

import { useModal } from '@faceless-ui/modal'
import { usePathname } from 'next/navigation.js'
import { useEffect, useRef } from 'react'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'

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
