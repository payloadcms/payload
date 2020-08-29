const getExtractJWT = require('../../getExtractJWT');

function refresh(collection) {
  async function resolver(_, __, context) {
    const extractJWT = getExtractJWT(this.config);
    const token = extractJWT(context.req);

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

module.exports = refresh;
