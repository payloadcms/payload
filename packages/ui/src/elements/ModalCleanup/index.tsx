import { useModal } from '@faceless-ui/modal'
import { usePathname } from 'next/navigation.js'
import React from 'react'

export const ModalCleanup: React.FC = () => {
  const { closeAllModals } = useModal()
  const pathname = usePathname()

  React.useEffect(() => {
    return () => {
      closeAllModals()
    }
  }, [closeAllModals, pathname])

  return null
}
