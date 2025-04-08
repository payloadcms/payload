'use client'

import { logoutFunction } from './logoutFunction.js'

const LogoutButton = () => {
  const handleLogout = async () => {
    await logoutFunction()
    console.log('User logged out')
  }

  return <button onClick={handleLogout}>Custom Logout</button>
}

export default LogoutButton
