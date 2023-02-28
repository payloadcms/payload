export type Props = {
  children?: React.ReactNode,
  className?: string,
  to?: string,
  icon?: React.ReactNode,
  alignIcon?: 'left' | 'right',
  onClick?: () => void,
  pillStyle?: 'white' | 'light' | 'dark' | 'light-gray' | 'warning' | 'success',
  draggable?: boolean,
  id?: string
}

export type RenderedTypeProps = {
  children: React.ReactNode
  className?: string,
  to: string,
  onClick?: () => void,
  type?: 'button'
}
