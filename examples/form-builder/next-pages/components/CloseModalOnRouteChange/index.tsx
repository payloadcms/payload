import React, { useEffect } from 'react'
import { useModal } from '@faceless-ui/modal'
import { useRouter } from 'next/router'

export const CloseModalOnRouteChange = () => {
  const { closeAllModals } = useModal()
  const { asPath } = useRouter()

  useEffect(() => {
    closeAllModals()
  }, [asPath, closeAllModals])

  return null
}
