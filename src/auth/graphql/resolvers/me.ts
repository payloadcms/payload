function me(collectionSlug: string): any {
  async function resolver(_, __, context) {
    return this.operations.collections.auth.me({
      req: context.req,
      collectionSlug,
    });
  }

  const meResolver = resolver.bind(this);

  return meResolver;
}

export default me;
