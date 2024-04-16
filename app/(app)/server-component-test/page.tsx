import { getPayloadHMR } from '@payloadcms/next'
import React from 'react'

const Page = async () => {
  const payload = await getPayloadHMR({ disableOnInit: true })
  const url = payload.getAdminURL()

  return (
    <article className={['container'].filter(Boolean).join(' ')}>
      <h1>Payload 3.0</h1>
      <p>The admin panel is running at {url}</p>
    </article>
  )
}

export default Page
