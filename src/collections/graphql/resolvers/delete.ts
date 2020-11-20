/* eslint-disable no-param-reassign */
function getDeleteResolver(collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      id: args.id,
      req: context.req,
    };

    const result = await this.operations.collections.delete(options);

    return result;
  }

  const deleteResolver = resolver.bind(this);
  return deleteResolver;
}

module.exports = getDeleteResolver;
