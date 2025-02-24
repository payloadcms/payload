'use client'

import { useField } from '@payloadcms/ui'

export function AfterField() {
  const { setValue } = useField({ path: 'customJSON' })

  return (
    <button
      id="set-custom-json"
      onClick={(e) => {
        e.preventDefault()
        setValue({
          users: [
            {
              id: 1,
              name: 'John Doe',
              email: 'john.doe@example.com',
              isActive: true,
              roles: ['admin', 'editor'],
            },
            {
              id: 2,
              name: 'Jane Smith',
              email: 'jane.smith@example.com',
              isActive: false,
              roles: ['viewer'],
            },
          ],
        })
      }}
      style={{ marginTop: '5px', padding: '5px 10px' }}
      type="button"
    >
      Set Custom JSON
    </button>
  )
}
