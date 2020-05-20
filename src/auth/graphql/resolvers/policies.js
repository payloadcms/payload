const { policies } = require('../../operations');

const policyResolver = (config, collection) => async (_, __, context) => {
  const options = {
    config,
    collection,
    req: context,
  };

  const policyResults = await policies(options);
  return policyResults;
};

module.exports = policyResolver;
