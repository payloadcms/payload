/* eslint-disable no-param-reassign */

function findOne(globalConfig) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const { slug } = globalConfig;

    const options = {
      globalConfig,
      slug,
      depth: 0,
      req: context.req,
    };

    const result = await this.operations.globals.findOne(options);
    return result;
  }

  const findOneResolver = resolver.bind(this);
  return findOneResolver;
}

export default findOne;
