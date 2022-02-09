export type Props = {
  className?: string,
  to?: string,
  icon?: React.ReactNode,
  alignIcon?: 'left' | 'right',
  onClick?: () => void,
  pillStyle?: 'white' | 'light' | 'dark' | 'light-gray' | 'warning' | 'success',
}

export type RenderedTypeProps = {
  className?: string,
  to: string,
  onClick?: () => void,
  type?: 'button'
}
