'use client'

import { useAllFormFields } from '@payloadcms/ui'

export const NonDirtyFieldUpdater = () => {
  const [, dispatchFields] = useAllFormFields()

  return (
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
  )
}
