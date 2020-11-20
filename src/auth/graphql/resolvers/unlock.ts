function unlock(collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: { email: args.email },
      req: context.req,
    };

    await this.operations.collections.auth.unlock(options);
    return true;
  }

  const unlockResolver = resolver.bind(this);

  return unlockResolver;
}

export default unlock;
