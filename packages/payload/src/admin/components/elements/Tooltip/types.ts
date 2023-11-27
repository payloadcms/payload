export type Props = {
  alignCaret?: 'center' | 'left' | 'right'
  boundingRef?: React.RefObject<HTMLElement>
  children: React.ReactNode
  className?: string
  delay?: number
  show?: boolean
}
