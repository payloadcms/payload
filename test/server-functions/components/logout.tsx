'use client'

import { logoutFunction } from './logoutFunction.js'

const LogoutButton = () => {
  return <button onClick={() => logoutFunction()}>Custom Logout</button>
}
export default LogoutButton
