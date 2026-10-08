import type { ReactNode } from 'react'

import { FormHeader, MinimalTemplate } from '@payloadcms/ui/rsc'

type Props = {
  cookies: ReactNode
  isAuthenticated: boolean
  login: ReactNode
  logout: ReactNode
  refresh: ReactNode
}

export function ServerFunctionsView({ cookies, isAuthenticated, login, logout, refresh }: Props) {
  return (
    <MinimalTemplate>
      <FormHeader
        description="Exercise framework-specific authentication and cookie handling."
        heading="Auth server functions"
      />

      <section>
        <h2>Cookies</h2>
        {cookies}
      </section>

      {isAuthenticated ? (
        <section>
          <h2>Session</h2>
          {refresh}
          {logout}
        </section>
      ) : (
        <section>
          <h2>Login</h2>
          {login}
        </section>
      )}
    </MinimalTemplate>
  )
}
