const commandExists = require('command-exists');
const { getArgs } = require('./getArgs');

let PACKAGE_MANAGER = false;
const getPackageManager = async () => {
  if (PACKAGE_MANAGER) {
    return PACKAGE_MANAGER;
  }

  const args = getArgs();

  if (args['--use-npm']) {
    PACKAGE_MANAGER = 'npm';
  } else {
    try {
      await commandExists('yarn');
      PACKAGE_MANAGER = 'yarn';
    } catch (error) {
      PACKAGE_MANAGER = 'npm';
    }
  }
  return PACKAGE_MANAGER;
}

module.exports = { getPackageManager };