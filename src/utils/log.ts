import chalk from 'chalk'
import figures from 'figures'

export const success = (message: string): void => {
  console.log(`${chalk.green(figures.tick)} ${chalk.bold(message)}`)
}

export const warning = (message: string): void => {
  console.log(chalk.yellow('? ') + chalk.bold(message))
}

export const info = (message: string): void => {
  console.log(`${chalk.yellow(figures.info)} ${chalk.bold(message)}`)
}

export const error = (message: string): void => {
  console.log(`${chalk.red(figures.cross)} ${chalk.bold(message)}`)
}
