const fs = require('fs');
const path = require('path');

const getDirectories = (dir) => fs.readdirSync(dir).filter(file => {
  return fs.statSync(dir + '/' + file).isDirectory();
});

const getValidTemplates = async () => {
  const templateDir = path.resolve(__dirname, '../templates');
  return getDirectories(templateDir);
};

module.exports = { getValidTemplates };