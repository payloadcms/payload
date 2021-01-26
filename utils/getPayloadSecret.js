const prompts = require('prompts');
const { getArgs } = require('./getArgs');

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
      type: 'password',
      name: 'value',
      message: 'Enter a long, complex string for Payload’s encryption key',
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