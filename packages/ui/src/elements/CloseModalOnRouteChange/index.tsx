'use client'

import { useModal } from '@faceless-ui/modal'
import { usePathname } from 'next/navigation.js'
import { useEffect } from 'react'

export function CloseModalOnRouteChange() {
  const { closeAllModals } = useModal()
  const pathname = usePathname()

  useEffect(() => {
    closeAllModals()
  }, [pathname, closeAllModals])

  return null
}
