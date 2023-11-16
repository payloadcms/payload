import type { ElementType } from 'react'

export type Props = {
  actions?: React.ReactNode
  buttonAriaLabel?: string
  id?: string
  onClick?: () => void
  title: string
  titleAs?: ElementType
}
