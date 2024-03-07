'use client'
import { Modal, useModal } from '@faceless-ui/modal'
// TODO: abstract the `next/navigation` dependency out from this component
import { useRouter } from 'next/navigation.js'
import React from 'react'

import type { Props } from './types.js'

import { Button } from '../../elements/Button/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'stay-logged-in'

const modalSlug = 'stay-logged-in'

const StayLoggedInModal: React.FC<Props> = (props) => {
  const { refreshCookie } = props
  const router = useRouter()
  const config = useConfig()
  const {
    admin: { logoutRoute },
    routes: { admin },
  } = config
  const { toggleModal } = useModal()
  const { t } = useTranslation()

  return (
    <Modal className={baseClass} slug="stay-logged-in">
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('authentication:stayLoggedIn')}</h1>
          <p>{t('authentication:youAreInactive')}</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button
            buttonStyle="secondary"
            onClick={() => {
              toggleModal(modalSlug)
              router.push(`${admin}${logoutRoute}`)
            }}
          >
            {t('authentication:logOut')}
          </Button>
          <Button
            onClick={() => {
              refreshCookie()
              toggleModal(modalSlug)
            }}
          >
            {t('authentication:stayLoggedIn')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default StayLoggedInModal
