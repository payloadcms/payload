export const generateFieldID = (
  path: string,
  editDepth: number,
  uuid: string,
  prefix: string = 'field',
) => {
  if (!path) {
    return undefined
  }
  return `${prefix}-${path.replace(/\./g, '__')}${editDepth > 1 ? `-${editDepth}` : ''}${uuid ? `-${uuid}` : ''}`
}
