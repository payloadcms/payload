export function formatPath(path) {
  // remove any double dots
  const regex = /\.{2,}/g
  const formattedPath = path.replace(regex, '.')

  // remove any trailing dots
  if (formattedPath.endsWith('.')) {
    return formattedPath.substring(0, formattedPath.length - 1)
  }

  return formattedPath
}
