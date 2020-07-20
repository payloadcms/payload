function init({ Model }) {
  async function resolver(_, __, context) {
    const options = {
      Model,
      req: context.req,
    };

    const result = await this.operations.collections.auth.init(options);

    return result;
  }

  const initResolver = resolver.bind(this);
  return initResolver;
}

module.exports = init;
