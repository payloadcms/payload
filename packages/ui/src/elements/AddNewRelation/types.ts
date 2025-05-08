import type { HasManyValueUnion } from '../../fields/Relationship/types.js'

export type Props = {
  readonly Button?: React.ReactNode
  readonly path: string
  readonly relationTo: string | string[]
  readonly setValue: (value: unknown) => void
  readonly unstyled?: boolean
} & HasManyValueUnion
