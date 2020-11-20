function login(collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: {
        email: args.email,
        password: args.password,
      },
      req: context.req,
      res: context.res,
    };

    const result = await this.operations.collections.auth.login(options);
    return result;
  }

  const loginResolver = resolver.bind(this);
  return loginResolver;
}

module.exports = login;
