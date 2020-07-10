/* eslint-disable no-param-reassign */
const { create } = require('../../operations');

const createResolver = (config, collection) => async (_, args, context) => {
  if (args.locale) {
    context.req.locale = args.locale;
  }

  const options = {
    config,
    collection,
    data: args.data,
    req: context.req,
  };

  const result = await create(options);

  return result;
};

module.exports = createResolver;
