/* eslint-disable no-param-reassign */
const { create } = require('../../operations');

const createResolver = collection => async (_, args, context) => {
  if (args.locale) {
    context.locale = args.locale;
  }

  const options = {
    config: collection.config,
    Model: collection.Model,
    data: args.data,
    req: context,
  };

  const result = await create(options);

  return result;
};

module.exports = createResolver;
