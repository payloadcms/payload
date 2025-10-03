export const generateFieldID = (path: string, editDepth: number, uuid: string) => {
  if (!path) {
    return undefined
  }
  return `field-${path.replace(/\./g, '__')}${editDepth > 1 ? `-${editDepth}` : ''}${uuid ? `-${uuid}` : ''}`
}
