import { Button } from '@payloadcms/ui'
import { type CustomComponent, getPayload, type PayloadServerReactComponent } from 'payload'
import React from 'react'

import config from './config.js'

async function handleClick() {
  'use server'

  const payload = await getPayload({ config })

  await payload.jobs.queue({
    input: {},
    queue: 'default',
    workflow: 'randomRetries',
  })

  let hasJobsRemaining = true

  while (hasJobsRemaining) {
    const response = await payload.jobs.run()

    if (response.noJobsRemaining) {
      hasJobsRemaining = false
    }
  }
}

export const QueueDemoJobs: PayloadServerReactComponent<CustomComponent> = ({ payload }) => {
  return (
    <div>
      <Button onClick={handleClick}>Queue and run demo jobs</Button>
    </div>
  )
}
