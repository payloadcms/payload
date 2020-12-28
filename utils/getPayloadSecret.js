const prompts = require('prompts');
const fs = require('fs');
const slugify  = require('@sindresorhus/slugify');
const { getArgs } = require('./getArgs');
const { getProjectName } = require('./getProjectName');

let PAYLOAD_SECRET;
const getPayloadSecret = async () => {
  if (PAYLOAD_SECRET) {
    return PAYLOAD_SECRET;
  }

  const args = getArgs();
  if (args['--secret']) {
    PAYLOAD_SECRET = args['--secret'];
    return PAYLOAD_SECRET;
  }

  const response = await prompts(
    {
      type: 'text',
      name: 'value',
      message: 'Enter Payload Secret',
      validate: value => value.length,
    },
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  PAYLOAD_SECRET = response.value;
  return PAYLOAD_SECRET;
};

module.exports = { getPayloadSecret };