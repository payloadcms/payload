import type { ReactNode } from 'react'

import { MinimalTemplate } from '@payloadcms/ui/rsc'

import './index.scss'

type Props = {
  isAuthenticated: boolean
  login: ReactNode
  logout: ReactNode
  refresh: ReactNode
}

const baseClass = 'auth-server-functions'

export function ServerFunctionsView({ isAuthenticated, login, logout, refresh }: Props) {
  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__content`}>
        <header className={`${baseClass}__header`}>
          <h1>Auth server functions</h1>
          <p>Exercise the framework-specific login, refresh, and logout entrypoints.</p>
        </header>

        {isAuthenticated ? (
          <section className={`${baseClass}__section`}>
            <h2>Session</h2>
            <div className={`${baseClass}__actions`}>
              {refresh}
              {logout}
            </div>
          </section>
        ) : (
          <section className={`${baseClass}__section`}>
            <h2>Login</h2>
            {login}
          </section>
        )}
      </div>
    </MinimalTemplate>
  )
}
