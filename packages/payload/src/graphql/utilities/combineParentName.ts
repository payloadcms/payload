import formatName from './formatName'

const combineParentName = (parent: string, name: string): string =>
  formatName(`${parent ? `${parent}_` : ''}${name}`)

export default combineParentName
