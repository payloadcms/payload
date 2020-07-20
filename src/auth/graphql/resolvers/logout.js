function logout(collection) {
  async function resolver(_, __, context) {
    const options = {
      collection,
      res: context.res,
      req: context.req,
    };

    const result = await this.operations.collections.auth.logout(options);

    return result;
  }

  const logoutResolver = resolver.bind(this);
  return logoutResolver;
}

module.exports = logout;
