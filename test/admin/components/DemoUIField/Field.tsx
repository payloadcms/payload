'use client'

import { useAllFormFields } from '@payloadcms/ui'
import React from 'react'

export const DemoUIField: React.FC = () => {
  const [, dispatchFields] = useAllFormFields()
  const [targetUploadId, setTargetUploadId] = React.useState('')

  return (
    <div>
      <p className="field-type">Demo UI Field</p>

      <label htmlFor="upload-target-id">Target upload ID</label>
      <input
        data-testid="upload-target-id"
        id="upload-target-id"
        onChange={(event) => setTargetUploadId(event.target.value)}
        value={targetUploadId}
      />

      <button
        data-testid="update-upload"
        onClick={() => {
          dispatchFields({
            type: 'UPDATE',
            path: 'upload',
            value: targetUploadId,
          })
        }}
        type="button"
      >
        Update upload field
      </button>
    </div>
  )
}
