type Args = {
  baseRow: Record<string, unknown>
  data: unknown[]
  texts: Record<string, unknown>[]
}

export const transformTexts = ({ baseRow, data, texts }: Args) => {
  data.forEach((val, i) => {
    texts.push({
      ...baseRow,
      text: val,
      order: i + 1,
    })
  })
}
