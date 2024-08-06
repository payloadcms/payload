import React from 'react'

import LogOut from '../../../../packages/payload/src/admin/components/icons/LogOut'
import { useConfig } from '../../../../packages/payload/src/admin/components/utilities/Config'

const Logout = () => {
  const config = useConfig()
  const {
    admin: { logoutRoute },
    routes: { admin },
  } = config
  return (
    <a href={`${admin}${logoutRoute}#custom`}>
      <LogOut />
    </a>
  )
}

export default Logout
