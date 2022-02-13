/* eslint-disable no-param-reassign */

import { SanitizedGlobalConfig } from '../../config/types';
import { Document } from '../../../types';

export default function restoreVersion(globalConfig: SanitizedGlobalConfig): Document {
  async function resolver(_, args, context) {
    const options = {
      id: args.id,
      globalConfig,
      req: context.req,
    };

    const result = await this.operations.globals.restoreVersion(options);
    return result;
  }

  const restoreVersionResolver = resolver.bind(this);
  return restoreVersionResolver;
}
