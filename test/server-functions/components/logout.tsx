'use client'
import { logout } from '@payloadcms/next/server-functions'

const LogoutButton = () => {
  const handleLogout = async () => {
    await logout()
    console.log('User logged out')
  }

  return <button onClick={handleLogout}>Custom Logout</button>
}

export default LogoutButton
