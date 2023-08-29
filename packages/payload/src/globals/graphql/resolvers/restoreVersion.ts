/* eslint-disable no-param-reassign */

import type { PayloadRequest } from '../../../express/types.js';
import type { Document } from '../../../types/index.js';
import type { SanitizedGlobalConfig } from '../../config/types.js';

import restoreVersion from '../../operations/restoreVersion.js';

type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>
export default function restoreVersionResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context) {
    const options = {
      depth: 0,
      globalConfig,
      id: args.id,
      req: context.req,
    };

    const result = await restoreVersion(options);
    return result;
  };
}
