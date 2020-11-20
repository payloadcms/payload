/* eslint-disable no-param-reassign */
function verifyEmail(collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      token: args.token,
      req: context.req,
      res: context.res,
      api: 'GraphQL',
    };

    const success = await this.operations.collections.auth.verifyEmail(options);
    return success;
  }

  const verifyEmailResolver = resolver.bind(this);
  return verifyEmailResolver;
}

module.exports = verifyEmail;
