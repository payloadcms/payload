export type Props = {
  isSelected: boolean
  option: {
    label: string
    value: string
  }
  onChange: (val: string) => void
  path: string
}
