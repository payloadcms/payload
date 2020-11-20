import formatName from '../../../graphql/utilities/formatName';

const formatConfigNames = (results, configs) => {
  const formattedResults = { ...results };

  configs.forEach(({ slug }) => {
    const result = { ...(formattedResults[slug] || {}) };
    delete formattedResults[slug];
    formattedResults[formatName(slug)] = result;
  });

  return formattedResults;
};

async function access(_, __, context) {
  const options = {
    req: context.req,
  };

  let accessResults = await this.operations.collections.auth.access(options);

  accessResults = formatConfigNames(accessResults, this.config.collections);
  accessResults = formatConfigNames(accessResults, this.config.globals);

  return accessResults;
}

export default access;
