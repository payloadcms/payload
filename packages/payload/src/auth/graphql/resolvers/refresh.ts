import { Collection } from '../../../collections/config/types';
import refresh from '../../operations/refresh';
import getExtractJWT from '../../getExtractJWT';

function refreshResolver(collection: Collection) {
  async function resolver(_, args, context) {
    let token;

    const extractJWT = getExtractJWT(context.req.payload.config);
    token = extractJWT(context.req);

    if (args.token) {
      token = args.token;
    }

    const options = {
      collection,
      token,
      req: context.req,
      res: context.res,
      depth: 0,
    };

    const result = await refresh(options);

    return result;
  }

  return resolver;
}

export default refreshResolver;
