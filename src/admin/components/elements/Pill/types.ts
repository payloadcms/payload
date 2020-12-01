export type Props = {
  className?: string,
  to?: string,
  icon?: React.ReactNode,
  alignIcon?: 'left' | 'right',
  onClick?: () => void,
  pillStyle?: 'light' | 'dark' | 'light-gray',
}

export type RenderedTypeProps = {
  className?: string,
  to: string,
  onClick?: () => void,
  type?: 'button'
}
