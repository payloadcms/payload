import type { AdminViewServerProps } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'
import React from 'react'

import { UploadFormTestClient } from './index.client.js'

export function UploadFormTestView({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult
  const { payload } = req

  const serverURL = payload.config.serverURL

  return (
    <MinimalTemplate>
      <UploadFormTestViewAsync payload={payload} serverURL={serverURL} />
    </MinimalTemplate>
  )
}

async function UploadFormTestViewAsync({
  payload,
  serverURL,
}: {
  payload: AdminViewServerProps['initPageResult']['req']['payload']
  serverURL: string
}) {
  const { docs } = await payload.find({
    collection: 'forms',
    depth: 0,
    limit: 100,
    pagination: false,
  })

  const uploadForms = docs.filter((form) =>
    form.fields?.some((field) => field.blockType === 'upload'),
  )

  return (
    <div
      style={{
        marginTop: 'calc(var(--base) * 2)',
        paddingLeft: 'var(--gutter-h)',
        paddingRight: 'var(--gutter-h)',
      }}
    >
      <h1>Upload Form Test</h1>
      <p>Use the forms below to test file uploads via the Payload REST API.</p>
      <UploadFormTestClient forms={uploadForms} serverURL={serverURL} />
    </div>
  )
}
