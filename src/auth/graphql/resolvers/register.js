/* eslint-disable no-param-reassign */
function register(collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: args.data,
      depth: 0,
      req: context.req,
    };

    if (args.locale) {
      context.req.locale = args.locale;
      options.locale = args.locale;
    }

    if (args.fallbackLocale) {
      context.req.fallbackLocale = args.fallbackLocale;
      options.fallbackLocale = args.fallbackLocale;
    }

    const token = await this.operations.collections.auth.register(options);

    return token;
  }

  const registerResolver = resolver.bind(this);
  return registerResolver;
}

module.exports = register;
