/* eslint-disable no-param-reassign */

export default function update(collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      data: args.data,
      id: args.id,
      depth: 0,
      req: context.req,
      draft: args.draft,
      autosave: args.autosave,
    };

    const result = await this.operations.collections.update(options);

    return result;
  }

  const updateResolver = resolver.bind(this);
  return updateResolver;
}
