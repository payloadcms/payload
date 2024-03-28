/* eslint-disable no-console */
import chalk from 'chalk'
import figures from 'figures'

export const success = (message: string): void => {
  console.log(`${chalk.green(figures.tick)} ${chalk.bold(message)}`)
}

export const warning = (message: string): void => {
  console.log(chalk.yellow('? ') + chalk.bold(message))
}

export const info = (message: string, paddingTop?: number): void => {
  console.log(
    `${'\n'.repeat(paddingTop || 0)}${chalk.green(figures.pointerSmall)} ${chalk.bold(message)}`,
  )
}

export const error = (message: string): void => {
  console.log(`${chalk.red(figures.cross)} ${chalk.bold(message)}`)
}

export const debug = (message: string): void => {
  console.log(
    `${chalk.gray(figures.pointerSmall)} ${chalk.bgGray('[DEBUG]')} ${chalk.gray(message)}`,
  )
}
