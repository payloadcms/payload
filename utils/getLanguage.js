const prompts = require('prompts');
const { getArgs } = require('./getArgs');

let LANGUAGE;
const getLanguage = async () => {
  if (LANGUAGE) {
    return LANGUAGE;
  }

  const args = getArgs();
  // TODO: Split template to get lang?
  if (args['--template']) {
    LANGUAGE = args['--template'];
    return LANGUAGE;
  }

  const response = await prompts(
    {
      type: 'select',
      name: 'value',
      message: 'Choose language',
      choices: [
        {
          title: 'javascript', value: 'js'
        },
        {
          title: 'typescript', value: 'ts'
        }
      ],
      validate: value => value.length,
    },
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  LANGUAGE = response.value;
  return LANGUAGE;
};

module.exports = { getLanguage };