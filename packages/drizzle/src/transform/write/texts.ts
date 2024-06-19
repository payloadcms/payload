type Args = {
  baseRow: Record<string, unknown>
  data: unknown[]
  texts: Record<string, unknown>[]
}

export const transformTexts = ({ baseRow, data, texts }: Args) => {
  data.forEach((val, i) => {
    texts.push({
      ...baseRow,
      order: i + 1,
      text: val,
    })
  })
}
