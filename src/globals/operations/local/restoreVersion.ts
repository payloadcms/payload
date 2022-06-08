import { Payload } from '../../..';
import { PayloadRequest } from '../../../express/types';
import { Document } from '../../../types';
import { TypeWithVersion } from '../../../versions/types';
import restoreVersion from '../restoreVersion';

export type Options = {
  slug: string
  id: string
  depth?: number
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

export default async function restoreVersionLocal<T extends TypeWithVersion<T> = any>(payload: Payload, options: Options): Promise<T> {
  const {
    slug: globalSlug,
    depth,
    id,
    user,
    overrideAccess = true,
    showHiddenFields,
  } = options;

  const globalConfig = payload.globals[globalSlug];

  return restoreVersion({
    depth,
    globalConfig,
    overrideAccess,
    id,
    showHiddenFields,
    req: {
      user,
      payloadAPI: 'local',
      payload,
    } as PayloadRequest,
  });
}
