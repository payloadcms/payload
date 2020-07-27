/* eslint-disable no-param-reassign */

function create(collection) {
  async function resolver(_, args, context) {
    if (args.locale) {
      context.req.locale = args.locale;
    }

    const options = {
      collection,
      data: args.data,
      req: context.req,
    };

    const result = await this.operations.collections.create(options);

    return result;
  }

  const createResolver = resolver.bind(this);
  return createResolver;
}

module.exports = create;
