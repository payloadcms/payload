/* eslint-disable no-param-reassign */

function update(globalConfig) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const { slug } = globalConfig;

    const options = {
      globalConfig,
      slug,
      depth: 0,
      data: args.data,
      req: context.req,
      autosave: args.autosave,
    };

    const result = await this.operations.globals.update(options);
    return result;
  }

  const findOneResolver = resolver.bind(this);
  return findOneResolver;
}

export default update;
