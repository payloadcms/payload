export const generateFieldID = (path: string, editDepth: number, uuid: string) => {
  return `field-${path?.replace(/\./g, '__')}${editDepth > 1 ? `-${editDepth}` : ''}${uuid ? `-${uuid}` : ''}`
}
