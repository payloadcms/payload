'use client'
import * as facelessUIImport from '@faceless-ui/modal'
import { useAuth } from '@payloadcms/ui/providers/Auth'
// TODO: abstract the `next/navigation` dependency out from this component
import { useRouter } from 'next/navigation.js'
import React from 'react'

import { Button } from '../../elements/Button/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'stay-logged-in'

export const stayLoggedInModalSlug = 'stay-logged-in'

export const StayLoggedInModal: React.FC = () => {
  const { Modal, useModal } = facelessUIImport
  const { refreshCookie } = useAuth()

  const router = useRouter()
  const config = useConfig()

  const {
    admin: {
      routes: { logout: logoutRoute },
    },
    routes: { admin },
  } = config
  const { toggleModal } = useModal()
  const { t } = useTranslation()

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
              toggleModal(stayLoggedInModalSlug)
              router.push(`${admin}${logoutRoute}`)
            }}
          >
            {t('authentication:logOut')}
          </Button>
          <Button
            onClick={() => {
              refreshCookie()
              toggleModal(stayLoggedInModalSlug)
            }}
          >
            {t('authentication:stayLoggedIn')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
