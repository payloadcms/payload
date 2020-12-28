const prompts = require('prompts');
const fs = require('fs');
const { getArgs } = require('./getArgs');

const getDirectories = (path) => fs.readdirSync(path).filter(file => {
  return fs.statSync(path + '/' + file).isDirectory();
});

let TEMPLATE;
const getTemplate = async () => {
  if (TEMPLATE) {
    return TEMPLATE;
  }

  const args = getArgs();
  if (args['--template']) {
    TEMPLATE = args['--template'];
    return TEMPLATE;
  }

  const response = await prompts(
    {
      type: 'select',
      name: 'value',
      message: 'Choose project template',
      choices: getDirectories('./templates').map(p => {
        return { title: p, value: p };
      }),
      validate: value => value.length,
    },
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  TEMPLATE = response.value;
  return TEMPLATE;
};

module.exports = { getTemplate };