function forgotPassword(collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: { email: args.email },
      req: context.req,
      disableEmail: args.disableEmail,
    };

    await this.operations.collections.auth.forgotPassword(options);
    return true;
  }

  const forgotPasswordResolver = resolver.bind(this);

  return forgotPasswordResolver;
}

module.exports = forgotPassword;
