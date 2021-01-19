const fs = require('fs');
const path = require('path');
const { error, info } = require('./log');

const getDirectories = (dir) => fs.readdirSync(dir).filter(file => {
  return fs.statSync(dir + '/' + file).isDirectory();
});

let VALID_TEMPLATES;
const getValidTemplates = async () => {
  if (VALID_TEMPLATES) {
    return VALID_TEMPLATES;
  }
  const templateDir = path.resolve(__dirname, '../templates');
  VALID_TEMPLATES = getDirectories(templateDir);
  return VALID_TEMPLATES;
};

const validateTemplate = async (templateName) => {
  VALID_TEMPLATES = await getValidTemplates();
  if (!VALID_TEMPLATES.includes(templateName)) {
    error(`'${templateName}' is not a valid template.`);
    info(`Valid templates: ${VALID_TEMPLATES.join(', ')}`);
    return false;
  }
  return true;
}

module.exports = { getValidTemplates, validateTemplate };