export type Props = {
  children?: React.ReactNode,
  className?: string,
  to?: string,
  icon?: React.ReactNode,
  alignIcon?: 'left' | 'right',
  onClick?: (onClick) => void,
  pillStyle?: 'light' | 'dark' | 'light-gray',
}
