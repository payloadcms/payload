export const resolveFileFromOptions = async (file: Blob | string) => {
  if (typeof file === 'string') {
    const response = await fetch(file)
    const fileName = file.split('/').pop() ?? ''
    const blob = await response.blob()

    return new File([blob], fileName, { type: blob.type })
  } else {
    return file
  }
}
