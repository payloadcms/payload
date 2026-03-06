'use client'
import { useConfig } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import { useEffect, useState } from 'react'

export const BeforeDashboardClient = () => {
  const { config } = useConfig()

  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchMessage = async () => {
      const response = await fetch(
        formatAdminURL({
          apiRoute: config.routes.api,
          path: '/my-plugin-endpoint',
        }),
      )
      const result = await response.json()
      setMessage(result.message)
    }

    void fetchMessage()
  }, [config.serverURL, config.routes.api])

  return (
    <div>
      <h1>Added by the plugin: Before Dashboard Client</h1>
      <div>
        Message from the endpoint:
        <div>{message || 'Loading...'}</div>
      </div>
    </div>
  )
}
