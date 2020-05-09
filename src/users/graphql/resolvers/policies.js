const { policies } = require('../../operations');

const policyResolver = config => async (_, __, context) => {
  const options = {
    config,
    req: context,
  };

  const policyResults = await policies(options);
  return policyResults;
};

module.exports = policyResolver;
