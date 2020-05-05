const { promisify } = require('util');
const fs = require('fs');

const sanitize = require('sanitize-filename');

const stat = promisify(fs.stat);

const incrementName = (name) => {
  const extension = name.split('.').pop();
  const baseFilename = sanitize(name.substr(0, name.lastIndexOf('.')) || name);
  let incrementedName = baseFilename;
  const regex = /(.*)-(\d)$/;
  const found = baseFilename.match(regex);
  if (found === null) {
    incrementedName += '-1';
  } else {
    const matchedName = found[1];
    const matchedNumber = found[2];
    const incremented = Number(matchedNumber) + 1;
    const newName = `${matchedName}-${incremented}`;
    incrementedName = newName;
  }
  return `${incrementedName}.${extension}`;
};

const utilities = {
  async getFileSystemSafeFileName(staticDir, desiredFilename) {
    let modifiedFilename = desiredFilename;
    const exists = async (fileName) => {
      console.log(`Checking for ${fileName} existence...`);
      try {
        await stat(fileName);
        return true;
      } catch (err) {
        return false;
      }
    };
    // eslint-disable-next-line no-await-in-loop
    while (await exists(`${staticDir}/${modifiedFilename}`)) {
      modifiedFilename = incrementName(modifiedFilename);
    }
    return modifiedFilename;
  },
};

module.exports = utilities;
