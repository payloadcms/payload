/* eslint-disable no-param-reassign */
function resetPassword(collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      data: args,
      req: context.req,
      api: 'GraphQL',
    };

    const token = await this.operations.collections.auth.resetPassword(options);

    return token;
  }

  const resetPasswordResolver = resolver.bind(this);
  return resetPasswordResolver;
}

module.exports = resetPassword;
