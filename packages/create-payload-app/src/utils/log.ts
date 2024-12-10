import * as p from '@clack/prompts'
import chalk from 'chalk'

export const warning = (message: string): void => {
  p.log.warn(chalk.yellow('? ') + chalk.bold(message))
}

export const info = (message: string): void => {
  p.log.step(chalk.bold(message))
}

export const error = (message: string): void => {
  p.log.error(chalk.bold(message))
}

export const debug = (message: string): void => {
  p.log.step(`${chalk.bgGray('[DEBUG]')} ${chalk.gray(message)}`)
}

export const log = (message: string): void => {
  p.log.message(message)
}
