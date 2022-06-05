import formatName from '../../../graphql/utilities/formatName';
import access from '../../operations/access';
import { Payload } from '../../..';

const formatConfigNames = (results, configs) => {
  const formattedResults = { ...results };

  configs.forEach(({ slug }) => {
    const result = { ...(formattedResults[slug] || {}) };
    delete formattedResults[slug];
    formattedResults[formatName(slug)] = result;
  });

  return formattedResults;
};

function accessResolver(payload: Payload) {
  async function resolver(_, args, context) {
    const options = {
      req: context.req,
    };

    let accessResults = await access(options);

    accessResults = formatConfigNames(accessResults, payload.config.collections);
    accessResults = formatConfigNames(accessResults, payload.config.globals);

    return accessResults;
  }

  return resolver;
}

export default accessResolver;
