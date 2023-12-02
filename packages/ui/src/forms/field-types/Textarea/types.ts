import type { TextareaField } from 'payload/types'

export type Props = Omit<TextareaField, 'type'> & {
  path?: string
}
