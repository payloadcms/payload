import { Document } from '../../../types';
import { TypeWithVersion } from '../../../versions/types';

export type Options = {
  slug: string
  id: string
  depth?: number
  user?: Document
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

export default async function restoreVersion<T extends TypeWithVersion<T> = any>(options: Options): Promise<T> {
  const {
    slug: globalSlug,
    depth,
    id,
    user,
    overrideAccess = true,
    showHiddenFields,
  } = options;

  const globalConfig = this.globals[globalSlug];

  return this.operations.globals.restoreVersion({
    depth,
    globalConfig,
    overrideAccess,
    id,
    showHiddenFields,
    req: {
      user,
      payloadAPI: 'local',
      payload: this,
    },
  });
}
