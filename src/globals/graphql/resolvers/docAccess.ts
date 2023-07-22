import { CollectionPermission, GlobalPermission } from '../../../auth';
import { PayloadRequest } from '../../../express/types';
import { SanitizedGlobalConfig } from '../../config/types';
import { docAccess } from '../../operations/docAccess';

export type Resolver = (
  _: unknown,
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<CollectionPermission | GlobalPermission>

export function docAccessResolver(global: SanitizedGlobalConfig): Resolver {
  async function resolver(_, context) {
    return docAccess({
      req: context.req,
      globalConfig: global,
    });
  }

  return resolver;
}
