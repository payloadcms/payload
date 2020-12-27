async function me(_, __, context) {
  return this.operations.collections.auth.me({ req: context.req });
}

export default me;
