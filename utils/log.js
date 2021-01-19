const chalk = require('chalk');
const figures = require('figures');

const isWin = process.platform === 'win32';

const success = (message) => {
  console.log(chalk.green(figures.tick) + ' ' + chalk.bold(message));
}

const warning = (message) => {
  console.log(chalk.yellow('? ') + chalk.bold(message));
}

const info = (message) => {
  console.log(chalk.yellow(figures.info) + ' ' + chalk.bold(message));
}

const error = (message) => {
  console.log(chalk.red(figures.cross) + ' ' + chalk.bold(message));
}

module.exports = {
  success,
  warning,
  info,
  error,
}
