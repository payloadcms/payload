const { access } = require('../../operations');
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

const accessResolver = (config) => async (_, __, context) => {
  const options = {
    config,
    req: context.req,
  };

  let accessResults = await access(options);

  accessResults = formatConfigNames(accessResults, config.collections);
  accessResults = formatConfigNames(accessResults, config.globals);

  return accessResults;
};

module.exports = accessResolver;
