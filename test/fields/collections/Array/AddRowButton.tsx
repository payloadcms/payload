'use client'

import { useForm } from '@payloadcms/ui'

const AddRowButton = () => {
  const { addFieldRow } = useForm()

  const handleClick = () => {
    addFieldRow({
      path: 'externallyUpdatedArray',
      schemaPath: 'externallyUpdatedArray',
      subFieldState: {
        text: {
          initialValue: 'Hello, world!',
          valid: true,
          value: 'Hello, world!',
        },
      },
    })
  }

  return (
    <button id="updateArrayExternally" onClick={handleClick} type="button">
      Add Row
    </button>
  )
}

export default AddRowButton
