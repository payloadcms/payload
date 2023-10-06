import type { HTMLAttributes } from 'react'

export type Props = {
  children: React.ReactNode
  className?: string
  gutter?: boolean
  header?: React.ReactNode
  hoverTitle?: boolean
  slug: string
  title?: string
}

export type TogglerProps = HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  slug: string
}
