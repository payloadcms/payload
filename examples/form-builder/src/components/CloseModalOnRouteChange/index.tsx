'use client'
import type React from 'react'

import { useModal } from '@faceless-ui/modal'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export const CloseModalOnRouteChange: React.FC = () => {
  const { closeAllModals } = useModal()
  const pathname = usePathname()

  useEffect(() => {
    closeAllModals()
  }, [pathname, closeAllModals])

  return null
}
