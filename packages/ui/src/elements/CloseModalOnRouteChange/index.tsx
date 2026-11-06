'use client'

import { useModal } from '@faceless-ui/modal'
import { useEffect, useRef } from 'react'

import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { usePathname } from '../../providers/RouterAdapter/index.js'

export function CloseModalOnRouteChange() {
  const { closeAllModals, modalState } = useModal()
  const pathname = usePathname()

  const closeOpenModals = useEffectEvent(() => {
    // The modal reducer returns a new state object for every action, even when nothing is open.
    // Skipping the no-op dispatch avoids re-rendering every modal consumer on each navigation.
    if (Object.values(modalState).some((modal) => modal.isOpen)) {
      closeAllModals()
    }
  })

  const previousPathnameRef = useRef(pathname)

  useEffect(() => {
    // React can run this effect again without a route change, e.g. when it reconnects effects
    // after hydrating or revealing a hidden `<Activity>`. Only close modals if the pathname changed.
    if (previousPathnameRef.current === pathname) {
      return
    }

    previousPathnameRef.current = pathname
    closeOpenModals()
  }, [pathname])

  return null
}
