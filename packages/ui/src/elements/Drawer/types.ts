import type { HTMLAttributes } from 'react'

export type Props = {
  readonly children: React.ReactNode
  readonly className?: string
  readonly gutter?: boolean
  readonly Header?: React.ReactNode
  readonly hoverTitle?: boolean
  readonly slug: string
  readonly title?: string
}

export type TogglerProps = {
  readonly children: React.ReactNode
  readonly className?: string
  readonly disabled?: boolean
  readonly slug: string
} & Readonly<HTMLAttributes<HTMLButtonElement>>
