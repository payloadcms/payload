'use client'

import { useAllFormFields, useForm } from '@payloadcms/ui'

export const NonDirtyFieldUpdater = () => {
  const [, dispatchFields] = useAllFormFields()
  const { submit } = useForm()

  return (
    <>
      <button
        id="set-programmatic-value"
        onClick={() => {
          dispatchFields({
            type: 'UPDATE',
            path: 'programmaticValue',
            value: 'Updated programmatically',
          })
        }}
        type="button"
      >
        Set programmatic value
      </button>
      <button id="queue-save" onClick={() => void submit()} type="button">
        Queue save
      </button>
    </>
  )
}
