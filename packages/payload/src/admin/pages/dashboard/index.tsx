import React from 'react'

import type { SanitizedConfig } from '../../../config/types'

import { createClientConfig } from '../../../config/createClientConfig'
import { ClientComponent } from './TestClientComponent'

export const dashboard = ({ config: configPromise }: { config: Promise<SanitizedConfig> }) =>
  async function () {
    const config = await createClientConfig(configPromise)

    return (
      <React.Fragment>
        <h1>Dashboard (rendered on server)</h1>
        <ClientComponent config={config} />
      </React.Fragment>
    )
  }
