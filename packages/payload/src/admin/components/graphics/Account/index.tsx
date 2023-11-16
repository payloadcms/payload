import React from 'react'
import { useLocation } from 'react-router-dom'

import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { DefaultAccountIcon } from './Default'
import Gravatar from './Gravatar'

const Account = () => {
  const {
    admin: { avatar: Avatar },
    routes: { admin: adminRoute },
  } = useConfig()
  const { user } = useAuth()
  const location = useLocation()

  const isOnAccountPage = location.pathname === `${adminRoute}/account`

  if (!user.email || Avatar === 'default') return <DefaultAccountIcon active={isOnAccountPage} />
  if (Avatar === 'gravatar') return <Gravatar />
  if (Avatar) return <Avatar active={isOnAccountPage} />
  return <DefaultAccountIcon active={isOnAccountPage} />
}

export default Account

function isClassComponent(component) {
  return typeof component === 'function' && !!component.prototype.isReactComponent
}

function isFunctionComponent(component) {
  return typeof component === 'function' && String(component).includes('return React.createElement')
}

function isReactComponent(component) {
  return isClassComponent(component) || isFunctionComponent(component)
}
