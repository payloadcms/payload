import fileType from 'file-type'

export const getFileType = async ({ filePath }: { filePath: string }) => {
  return fileType.fromFile(filePath)
}
