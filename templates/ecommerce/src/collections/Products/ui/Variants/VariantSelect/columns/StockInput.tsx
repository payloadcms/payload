'use client'

import { useField } from '@payloadcms/ui'

type Props = {
  path: string
}

export const StockInput: React.FC<Props> = (args) => {
  const { path } = args

  const { value, setValue } = useField<number>({ path })

  return (
    <div className="field-type number">
      <input
        type="number"
        onChange={(e) => {
          const value = e.target.value ? parseInt(e.target.value) : ''
          setValue(value)
        }}
        value={value || ''}
      />
    </div>
  )
}
