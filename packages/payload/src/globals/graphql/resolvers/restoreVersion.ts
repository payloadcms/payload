/* eslint-disable no-param-reassign */

import { SanitizedGlobalConfig } from '../../config/types';
import { Document } from '../../../types';
import restoreVersion from '../../operations/restoreVersion';
import { PayloadRequest } from '../../../express/types';

type Resolver = (
  _: unknown,
  args: {
    id: string | number
  },
  context: {
    req: PayloadRequest,
    res: Response
  }
) => Promise<Document>
export default function restoreVersionResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context) {
    const options = {
      id: args.id,
      globalConfig,
      req: context.req,
      depth: 0,
    };

    const result = await restoreVersion(options);
    return result;
  };
}
