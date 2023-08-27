import { CollectionPermission, GlobalPermission } from '../../../auth.js';
import { PayloadRequest } from '../../../express/types.js';
import { docAccess } from '../../operations/docAccess.js';

export type Resolver = (
  _: unknown,
  args: {
    id: string | number
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<CollectionPermission | GlobalPermission>

export function docAccessResolver(): Resolver {
  async function resolver(_, args, context) {
    return docAccess({
      req: context.req,
      id: args.id,
    });
  }

  return resolver;
}
