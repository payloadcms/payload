type Args = {
  baseRow: Record<string, unknown>
  data: unknown[]
  numbers: Record<string, unknown>[]
}

export const transformNumbers = ({ baseRow, data, numbers }: Args) => {
  data.forEach((val, i) => {
    numbers.push({
      ...baseRow,
      number: val,
      order: i + 1,
    })
  })
}
