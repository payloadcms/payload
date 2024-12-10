import { formatName } from './formatName.js'

export const combineParentName = (parent: string, name: string): string =>
  formatName(`${parent ? `${parent}_` : ''}${name}`)
