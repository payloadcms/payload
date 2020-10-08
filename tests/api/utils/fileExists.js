const fs = require('fs');
const { promisify } = require('util');

const stat = promisify(fs.stat);

const fileExists = async (fileName) => {
  try {
    await stat(fileName);
    return true;
  } catch (err) {
    return false;
  }
};

module.exports = fileExists;
