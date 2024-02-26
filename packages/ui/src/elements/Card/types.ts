import type { ElementType } from 'react'

export type Props = {
  Link?: ElementType
  actions?: React.ReactNode
  buttonAriaLabel?: string
  href?: string
  id?: string
  onClick?: () => void
  title: string
  titleAs?: ElementType
}
