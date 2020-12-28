const prompts = require('prompts');
const fs = require('fs');
const slugify  = require('@sindresorhus/slugify');
const { getArgs } = require('./getArgs');
const { getProjectName } = require('./getProjectName');

let MONGODB_URI;
const getDatabaseConnection = async () => {
  if (MONGODB_URI) {
    return MONGODB_URI;
  }

  const args = getArgs();
  if (args['--db']) {
    MONGODB_URI = args['--db'];
    return MONGODB_URI;
  }

  const response = await prompts(
    {
      type: 'text',
      name: 'value',
      message: 'Enter MongoDB connection',
      initial: `mongodb://localhost/${slugify(await getProjectName())}`,
      validate: value => value.length,
    },
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  MONGODB_URI = response.value;
  return MONGODB_URI;
};

module.exports = { getDatabaseConnection };