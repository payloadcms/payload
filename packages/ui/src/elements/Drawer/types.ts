import type { HTMLAttributes } from 'react'

export type Props = {
  Header?: React.ReactNode
  children: React.ReactNode
  className?: string
  gutter?: boolean
  hoverTitle?: boolean
  slug: string
  title?: string
}

export type TogglerProps = {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  slug: string
} & HTMLAttributes<HTMLButtonElement>
