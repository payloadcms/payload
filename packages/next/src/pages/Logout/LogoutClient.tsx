import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../../../ui/src/providers/Auth'

export const Logout: React.FC<{ inactivity?: boolean }> = (props) => {
  const { inactivity } = props

  const { logOut } = useAuth()

  const { t } = useTranslation('authentication')

  // Fetch 'redirect' from the query string which denotes the URL the user originally tried to visit. This is set in the Routes.tsx file when a user tries to access a protected route and is redirected to the login screen.
  const query = new URLSearchParams(useLocation().search)
  const redirect = query.get('redirect')

  useEffect(() => {
    logOut()
  }, [logOut])

  return null
}

export default Logout
