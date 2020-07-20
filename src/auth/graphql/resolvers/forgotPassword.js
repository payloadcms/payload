function forgotPassword(collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: args,
      req: context.req,
    };

    await this.operations.collections.auth.forgotPassword(options);
    return true;
  }

  const forgotPasswordResolver = resolver.bind(this);

  return forgotPasswordResolver;
}

module.exports = forgotPassword;
