import type { HTMLAttributes } from 'react'

export type Props = {
  children: React.ReactNode
  className?: string
  closeAreaSize?: 'default' | 'small'
  gutter?: boolean
  header?: React.ReactNode
  slug: string
  title?: string
}

export type TogglerProps = HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  slug: string
}
