/* eslint-disable no-param-reassign */
function find(collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      where: args.where,
      limit: args.limit,
      page: args.page,
      sort: args.sort,
      req: context.req,
    };

    const results = await this.operations.collections.find(options);
    return results;
  }

  const findResolver = resolver.bind(this);
  return findResolver;
}

module.exports = find;
