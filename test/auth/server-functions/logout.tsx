'use client'

import { logoutFunction } from './logoutFunction.js'

const LogoutButton = () => {
  return (
    <button onClick={() => logoutFunction()} type="button">
      Custom Logout
    </button>
  )
}

export default LogoutButton
