export type Props = {
  fields: {
    label: string,
    value: string,
    operators: [],
  }[],
  value: {
    field: string,
    operator: string,
    value: string | number | Date,
  },
  dispatch: () => void
  orIndex: number,
  andIndex: number,
}
