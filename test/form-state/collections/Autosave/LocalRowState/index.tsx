'use client'

import type { UIFieldClientProps } from 'payload'

import { useField } from '@payloadcms/ui'
import { useMemo } from 'react'

export function LocalRowState({ path }: UIFieldClientProps) {
  const options = useMemo(() => ({ disableFormData: true, potentiallyStalePath: path }), [path])
  const { setValue, value } = useField<boolean>(options)

  return (
    <button aria-pressed={value === true} onClick={() => setValue(true)} type="button">
      Keep local row state
    </button>
  )
}
