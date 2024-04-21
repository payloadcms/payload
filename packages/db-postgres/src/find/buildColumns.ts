export const buildColumns = ({
  exclude,
  include,
  withSelection,
}: {
  exclude: string[]
  include: string[]
  withSelection: boolean
}): Record<string, boolean> => {
  return (withSelection ? include : exclude).reduce((acc, key) => {
    acc[key] = withSelection
    return acc
  }, {})
}
