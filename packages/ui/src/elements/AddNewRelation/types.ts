import type { Value } from '../../fields/Relationship/types.js'

export type Props = {
  readonly Button?: React.ReactNode
  readonly hasMany: boolean
  readonly path: string
  readonly relationTo: string | string[]
  readonly setValue: (value: unknown) => void
  readonly unstyled?: boolean
  readonly value: Value | Value[]
}
