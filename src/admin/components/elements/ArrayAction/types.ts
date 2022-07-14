export type Props = {
  addRow: (current: number) => void
  duplicateRow: (current: number) => void
  removeRow: (index: number) => void
  moveRow: (from: number, to: number) => void
  index: number
  rowCount: number
}
