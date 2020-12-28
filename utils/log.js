const chalk = require('chalk');

const isWin = process.platform === 'win32';

const success = (message) => {
  console.log(isWin
    ? chalk.green('√ ')
    : chalk.green('✔ ') + chalk.bold(message)
  );
}

const error = (message) => {
  console.log(isWin
    ? chalk.red('✖ ')
    : chalk.red('× ') + chalk.bold(message)
  );
}

module.exports = {
  success,
  error,
}
