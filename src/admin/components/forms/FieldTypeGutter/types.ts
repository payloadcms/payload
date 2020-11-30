export type Props = {
  variant?: 'left' | 'right'
  verticalAlignment?: 'top' | 'center' | 'sticky'
  dragHandleProps?: {
    [prop: string]: unknown
  }
  className?: string
}
