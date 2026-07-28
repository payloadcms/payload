'use client'

type Props = {
  logoutFunction: () => Promise<unknown>
}

export const LogoutButton = ({ logoutFunction }: Props) => {
  return (
    <button onClick={() => logoutFunction()} type="button">
      Custom Logout
    </button>
  )
}
