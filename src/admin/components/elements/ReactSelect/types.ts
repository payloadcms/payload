export type Props = {
  value?: string | [],
  onChange?: (formatValue) => void,
  disabled?: boolean,
  showError?: boolean,
  formatValue?: () => void,
  options?: string[] | { value: string, label: string }[],
  isMulti?: boolean,
}
