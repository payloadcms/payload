import getExtractJWT from '../../getExtractJWT';

function refresh(collection) {
  async function resolver(_, args, context) {
    let token;

    const extractJWT = getExtractJWT(this.config);
    token = extractJWT(context.req);

    if (args.token) {
      token = args.token;
    }

    const options = {
      collection,
      token,
      req: context.req,
      res: context.res,
    };

    const result = await this.operations.collections.auth.refresh(options);

    return result;
  }

  const refreshResolver = resolver.bind(this);
  return refreshResolver;
}

export default refresh;
