const { policies } = require('../../operations');
const formatName = require('../../../graphql/utilities/formatName');

const formatConfigNames = (results, configs) => {
  const formattedResults = { ...results };

  configs.forEach(({ slug }) => {
    const result = { ...(formattedResults[slug] || {}) };
    delete formattedResults[slug];
    formattedResults[formatName(slug)] = result;
  });

  return formattedResults;
};

const policyResolver = config => async (_, __, context) => {
  const options = {
    config,
    req: context,
  };

  let policyResults = await policies(options);

  policyResults = formatConfigNames(policyResults, config.collections);
  policyResults = formatConfigNames(policyResults, config.globals);

  return policyResults;
};

module.exports = policyResolver;
