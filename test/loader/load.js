export const load = async (filePath) => {
  const importConfigImport = await import(
    '../../packages/payload/dist/utilities/importWithoutClientFiles.js'
  )
  const importConfig = importConfigImport.importConfig

  const result = await importConfig(filePath)

  return result
}
