const withPolicy = require('../../../graphql/resolvers/withPolicy');
const findByIDQuery = require('../../queries/findByID');

const findByID = ({ config, model }) => withPolicy(
  config.policies.read,
  async (parent, { id }, context) => {
    console.log(parent);

    const options = {
      depth: 0,
      model,
      id,
      locale: context.locale,
    };

    if (context.query['fallback-locale']) options.fallbackLocale = context.query['fallback-locale'];

    const result = await findByIDQuery(options);

    return result;
  },
);

module.exports = findByID;
