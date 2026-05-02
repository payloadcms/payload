import * as p from '@clack/prompts'

import { miniChalk } from './miniChalk.js'

export const warning = (message: string): void => {
  p.log.warn(miniChalk.yellow('? ') + miniChalk.bold(message))
}

export const info = (message: string): void => {
  p.log.step(miniChalk.bold(message))
}

export const error = (message: string): void => {
  p.log.error(miniChalk.bold(message))
}

export const debug = (message: string): void => {
  if (process.env.DEBUG === 'true') {
    p.log.step(`${miniChalk.bgGray('[DEBUG]')} ${miniChalk.gray(message)}`)
  }
}

export const log = (message: string): void => {
  p.log.message(message)
}
