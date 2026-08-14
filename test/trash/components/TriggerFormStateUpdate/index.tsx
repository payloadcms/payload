'use client'

import { useField } from '@payloadcms/ui'

export const TriggerFormStateUpdate = () => {
  const { setValue } = useField({ path: 'showConditionalRichText' })

  return (
    <button id="trigger-form-state-update" onClick={() => setValue('show')} type="button">
      Trigger form state update
    </button>
  )
}
