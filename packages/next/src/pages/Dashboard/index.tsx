import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { createClientConfig } from '../../createClientConfig'

export const Dashboard = ({ config: configPromise }: { config: Promise<SanitizedConfig> }) =>
  async function () {
    const config = await createClientConfig(configPromise)

    return (
      <React.Fragment>
        <h1>Dashboard (rendered on server)</h1>
      </React.Fragment>
    )
  }
