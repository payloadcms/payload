import type { ElementType, MouseEvent } from 'react'
import type React from 'react'

type secondaryAction = {
  label: string
  onClick: (event: MouseEvent) => void
}
export type Props = {
  'aria-label'?: string
  buttonId?: string
  buttonStyle?: 'error' | 'icon-label' | 'none' | 'pill' | 'primary' | 'secondary' | 'transparent'
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  el?: 'anchor' | 'link' | ElementType
  icon?: ['chevron' | 'edit' | 'plus' | 'x'] | React.ReactNode
  iconPosition?: 'left' | 'right'
  iconStyle?: 'none' | 'with-border' | 'without-border'
  id?: string
  Link?: React.ElementType
  newTab?: boolean
  onClick?: (event: MouseEvent) => void
  round?: boolean
  secondaryActions?: secondaryAction | secondaryAction[]
  size?: 'large' | 'medium' | 'small'
  SubMenuPopupContent?: React.ReactNode
  to?: string
  tooltip?: string
  type?: 'button' | 'submit'
  url?: string
}
