import { Payload } from '..';
import { Document } from '../types';
import { TypeWithID } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';

type Args = {
  payload: Payload
  config: SanitizedGlobalConfig
  query: Record<string, unknown>
}

export const getLatestGlobalVersion = async <T extends TypeWithID = any>({
  payload,
  config,
  query,
}: Args): Promise<T> => {
  let version;
  if (config.versions?.drafts) {
    version = payload.versions[config.slug].findOne({}, {}, {
      sort: {
        updatedAt: 'desc',
      },
      lean: true,
    });
  }
  const global = await payload.globals.Model.findOne(query).lean() as Document;
  version = await version;
  if (!version || version.updatedAt < global.updatedAt) {
    return global;
  }
  return {
    ...version.version,
    updatedAt: version.updatedAt,
    createdAt: version.createdAt,
  };
};
