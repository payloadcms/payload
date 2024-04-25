export const buildColumns = ({
  exclude,
  include: incomingInclude,
  localized,
  withSelection,
}: {
  exclude: string[]
  include: string[]
  localized?: boolean
  withSelection: boolean
}): Record<string, boolean> => {
  const include = [...incomingInclude]
  if (localized) include.push('_locale')

  return (withSelection ? include : exclude).reduce((acc, key) => {
    acc[key] = withSelection
    return acc
  }, {})
}
