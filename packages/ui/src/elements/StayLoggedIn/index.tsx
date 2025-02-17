'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import { useRouter } from 'next/navigation.js'
import React from 'react'

import { Button } from '../../elements/Button/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import './index.scss'

const baseClass = 'stay-logged-in'

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

  const { closeModal } = useModal()
  const { t } = useTranslation()
  const { startRouteTransition } = useRouteTransition()

  return (
    <Modal className={baseClass} slug={stayLoggedInModalSlug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('authentication:stayLoggedIn')}</h1>
          <p>{t('authentication:youAreInactive')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button
            buttonStyle="secondary"
            onClick={() => {
              closeModal(stayLoggedInModalSlug)

              startRouteTransition(() =>
                router.push(
                  formatAdminURL({
                    adminRoute,
                    path: logoutRoute,
                  }),
                ),
              )
            }}
            size="large"
          >
            {t('authentication:logOut')}
          </Button>
          <Button
            onClick={() => {
              refreshCookie()
              closeModal(stayLoggedInModalSlug)
            }}
            size="large"
          >
            {t('authentication:stayLoggedIn')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
