import me from '../../operations/me';
import { Payload } from '../../..';

function meResolver(payload: Payload, collectionSlug: string): any {
  async function resolver(_, args, context) {
    const options = {
      req: context.req,
      collectionSlug,
    };
    return me(options);
  }
  return resolver;
}

export default meResolver;
