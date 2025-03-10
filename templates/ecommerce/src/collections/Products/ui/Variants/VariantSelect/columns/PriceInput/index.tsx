'use client'
import { useField } from '@payloadcms/ui'
import { FormattedInput } from './FormattedInput'

import './index.scss'

type Props = {
  path: string
}

export const PriceInput: React.FC<Props> = (args) => {
  const { path } = args

  const { value, setValue } = useField<number>({ path })

  return <FormattedInput value={value || 0} onChange={(value) => setValue(value)} />
}
