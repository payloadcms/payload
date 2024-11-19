'use client'

import { useForm } from '@payloadcms/ui'

const AddRowButton = () => {
  const { addFieldRow } = useForm()

  const handleClick = () => {
    addFieldRow({
      path: 'array',
      schemaPath: 'array',
      subFieldState: {
        text: {
          initialValue: 'aaa',
          valid: true,
          value: 'aaa',
        },
      },
    })
  }

  return (
    <button onClick={handleClick} type="button">
      Add Row
    </button>
  )
}

export default AddRowButton
