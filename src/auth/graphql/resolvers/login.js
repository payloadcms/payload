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

    const token = await this.operations.collections.auth.login(options);

    return token;
  }

  const loginResolver = resolver.bind(this);
  return loginResolver;
}

module.exports = login;
