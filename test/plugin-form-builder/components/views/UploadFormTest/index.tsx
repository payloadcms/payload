import type { AdminViewServerProps } from 'payload'

import { ArrowIcon, Button } from '@payloadcms/ui'
import { MinimalTemplate } from '@payloadcms/ui/rsc'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { UploadFormTestClient } from './index.client.js'
import './index.css'

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
  const dashboardURL = formatAdminURL({
    adminRoute: payload.config.routes.admin,
    path: '/',
  })

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
    <div className="upload-form-test__view">
      <Button
        buttonStyle="secondary"
        className="upload-form-test__back-button"
        el="link"
        icon={<ArrowIcon className="upload-form-test__back-icon" size={16} />}
        iconPosition="left"
        margin={false}
        to={dashboardURL}
      >
        Back to Dashboard
      </Button>
      <h1 className="upload-form-test__title">Upload Form Test</h1>
      <p className="upload-form-test__description">
        Use the forms below to test file uploads via the Payload REST API.
      </p>
      <UploadFormTestClient forms={uploadForms} serverURL={serverURL} />
    </div>
  )
}
