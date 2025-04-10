export const extractPathAndExportName = (
  pathAndMaybeExport: string,
  defaultExport?: string,
): { exportName: string | undefined; path: string } => {
  let path = pathAndMaybeExport
  let exportName = defaultExport

  // `#` is a valid import path prefix.
  // We have check if alias is not the only occurence.
  const lastDelimiterIndex = pathAndMaybeExport?.lastIndexOf('#') ?? -1
  if (lastDelimiterIndex > 0) {
    exportName = pathAndMaybeExport.substring(lastDelimiterIndex + 1)
    path = pathAndMaybeExport.substring(0, lastDelimiterIndex)
  }

  return { exportName, path }
}
