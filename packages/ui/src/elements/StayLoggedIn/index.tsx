import { Modal, useModal } from '@faceless-ui/modal'
import React from 'react'
import { useTranslation } from '../../providers/Translation'
import { useHistory } from 'react-router-dom'

import type { Props } from './types'

import { Button } from '../../elements/Button'
import { useConfig } from '../../providers/Config'
import './index.scss'

const baseClass = 'stay-logged-in'

const modalSlug = 'stay-logged-in'

const StayLoggedInModal: React.FC<Props> = (props) => {
  const { refreshCookie } = props
  const history = useHistory()
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
              history.push(`${admin}${logoutRoute}`)
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
