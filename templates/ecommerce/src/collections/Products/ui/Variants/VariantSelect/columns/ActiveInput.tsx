'use client'

import { CheckboxInput, useField } from '@payloadcms/ui'

type Props = {
  path: string
}

export const ActiveInput: React.FC<Props> = (args) => {
  const { path } = args

  const { value, setValue } = useField<boolean>({ path })

  return (
    <div className="field-type number">
      <CheckboxInput checked={value} onToggle={() => setValue(!value)} />
    </div>
  )
}
