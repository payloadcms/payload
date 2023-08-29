import type { CSSProperties } from 'react'

export type Props = {
  backgroundColor?: CSSProperties['backgroundColor']
  boundingRef?: React.MutableRefObject<HTMLElement>
  button?: React.ReactNode
  buttonClassName?: string
  buttonType?: 'custom' | 'default' | 'none'
  children?: React.ReactNode
  className?: string
  color?: 'dark' | 'light'
  forceOpen?: boolean
  horizontalAlign?: 'center' | 'left' | 'right'
  initActive?: boolean
  onToggleOpen?: (active: boolean) => void
  padding?: CSSProperties['padding']
  render?: (any) => React.ReactNode
  showOnHover?: boolean
  showScrollbar?: boolean
  size?: 'large' | 'small' | 'wide'
  verticalAlign?: 'bottom' | 'top'
}
