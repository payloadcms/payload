'use client'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback } from 'react'

import type { OnCancel } from '../ConfirmationModal/index.js'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'

export const stayLoggedInModalSlug = 'stay-logged-in'

export const StayLoggedInModal: React.FC = () => {
  const { refreshCookie } = useAuth()

  const router = useRouter()
  const { config } = useConfig()

  const {
    admin: {
      routes: { logout: logoutRoute },
    },
    routes: { admin: adminRoute },
  } = config

  const { t } = useTranslation()
  const { startRouteTransition } = useRouteTransition()

  const onConfirm = useCallback(() => {
    return startRouteTransition(() =>
      router.push(
        formatAdminURL({
          adminRoute,
          path: logoutRoute,
        }),
      ),
    )
  }, [router, startRouteTransition, adminRoute, logoutRoute])

  const onCancel: OnCancel = useCallback(() => {
    refreshCookie()
  }, [refreshCookie])

  return (
    <ConfirmationModal
      body={t('authentication:youAreInactive')}
      cancelLabel={t('authentication:stayLoggedIn')}
      confirmLabel={t('authentication:logOut')}
      heading={t('authentication:stayLoggedIn')}
      modalSlug={stayLoggedInModalSlug}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
