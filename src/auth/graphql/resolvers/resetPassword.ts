/* eslint-disable no-param-reassign */
function resetPassword(collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      data: args,
      req: context.req,
      res: context.res,
      api: 'GraphQL',
    };

    const result = await this.operations.collections.auth.resetPassword(options);

    return result;
  }

  const resetPasswordResolver = resolver.bind(this);
  return resetPasswordResolver;
}

export default resetPassword;
