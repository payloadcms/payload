import type { TextareaFieldProps } from 'packages/payload/src/index.js'
import { type ChangeEvent } from 'react'

export type TextAreaInputProps = {
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  showError?: boolean
  value?: string
} & TextareaFieldProps
