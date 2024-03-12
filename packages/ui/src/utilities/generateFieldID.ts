export const generateFieldID = (path: string, uuid: string) => {
  return `field-${path?.replace(/\./g, '__')}${uuid ? `-${uuid}` : ''}`
}
