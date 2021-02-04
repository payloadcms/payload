const prompts = require('prompts');
const { getArgs } = require('./getArgs');

let PROJECT_NAME;
const getProjectName = async () => {
  if (PROJECT_NAME) {
    return PROJECT_NAME;
  }

  const args = getArgs();
  if (args['--name']) {
    PROJECT_NAME = args['--name'];
    return PROJECT_NAME;
  }

  if (args._[0]) {
    PROJECT_NAME = args._[0];
    return PROJECT_NAME;
  }

  const response = await prompts(
    {
      type: 'text',
      name: 'value',
      message: 'Project name?',
      validate: value => value.length,
    },
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  PROJECT_NAME = response.value;
  return PROJECT_NAME;
};

module.exports = { getProjectName };
