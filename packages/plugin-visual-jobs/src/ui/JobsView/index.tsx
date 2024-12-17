import type { ServerSideEditViewProps } from 'payload'

import { Gutter } from '@payloadcms/ui'
import React from 'react'

import { JobsViewClient } from './index.client.js'
import { logsToRetrySequences } from './utilities/logsToRetrySequences.js'

export const JobsView: React.FC<ServerSideEditViewProps> = (props) => {
  const { doc } = props

  const retrySequences = logsToRetrySequences(doc.log)

  if (!retrySequences?.length) {
    return (
      <Gutter>
        <p>No logs to display</p>
      </Gutter>
    )
  }

  return (
    <Gutter>
      <br />
      <JobsViewClient retrySequences={retrySequences} />
    </Gutter>
  )
}
