import type { CodeField } from 'payload/types'

export type Props = Omit<CodeField, 'type'> & {
  path?: string
}
