export type Props = {
  active: boolean
  button: React.ReactNode
  buttonType: 'custom' | 'default' | 'none'
  className?: string
  setActive: (active: boolean) => void
}
