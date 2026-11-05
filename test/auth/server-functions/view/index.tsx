import type { ReactNode } from 'react'

import { FormHeader, MinimalTemplate } from '@payloadcms/ui/rsc'

type Props = {
  isAuthenticated: boolean
  login: ReactNode
  logout: ReactNode
  refresh: ReactNode
}

export function ServerFunctionsView({ isAuthenticated, login, logout, refresh }: Props) {
  return (
    <MinimalTemplate>
      <FormHeader
        description="Exercise the framework-specific login, refresh, and logout entrypoints."
        heading="Auth server functions"
      />

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
