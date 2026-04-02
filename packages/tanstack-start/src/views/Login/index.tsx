import { LoginForm } from '@payloadcms/ui'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

export function LoginView({ pageState }: { pageState: SerializablePageState }) {
  return (
    <div className="login">
      <LoginForm
        prefillEmail={pageState.pageData?.login?.prefillEmail}
        prefillPassword={pageState.pageData?.login?.prefillPassword}
        prefillUsername={pageState.pageData?.login?.prefillUsername}
        searchParams={pageState.searchParams}
      />
    </div>
  )
}
