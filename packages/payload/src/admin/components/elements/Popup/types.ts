import type { CSSProperties } from 'react'

export type Props = {
  backgroundColor?: CSSProperties['backgroundColor']
  boundingRef?: React.MutableRefObject<HTMLElement>
  button?: React.ReactNode
  buttonClassName?: string
  buttonType?: 'custom' | 'default' | 'none'
  caret?: boolean
  children?: React.ReactNode
  className?: string
  forceOpen?: boolean
  horizontalAlign?: 'center' | 'left' | 'right'
  initActive?: boolean
  onToggleOpen?: (active: boolean) => void
  render?: (any) => React.ReactNode
  showOnHover?: boolean
  showScrollbar?: boolean
  size?: 'fit-content' | 'large' | 'medium' | 'small'
  verticalAlign?: 'bottom' | 'top'
}
