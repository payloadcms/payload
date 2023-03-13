import { Payload } from '../payload';
import { docHasTimestamps, Document } from '../types';
import { GlobalModel, SanitizedGlobalConfig } from '../globals/config/types';

type Args = {
  payload: Payload
  query: Record<string, unknown>
  lean?: boolean
  Model: GlobalModel
  config: SanitizedGlobalConfig
}

export const getLatestGlobalVersion = async ({
  payload,
  config,
  Model,
  query,
  lean = true,
}: Args): Promise<{global: Document, globalExists: boolean}> => {
  let latestVersion;

  if (config.versions?.drafts) {
    latestVersion = await payload.versions[config.slug].findOne({}, {}, {
      sort: { updatedAt: 'desc' },
      lean,
    });
  }

  const global = await (Model as any).findOne(query, {}, { lean }) as Document;
  const globalExists = Boolean(global);

  if (!latestVersion || (docHasTimestamps(global) && latestVersion.updatedAt < global.updatedAt)) {
    return {
      global,
      globalExists,
    };
  }

  return {
    global: {
      ...latestVersion.version,
      updatedAt: latestVersion.updatedAt,
      createdAt: latestVersion.createdAt,
    },
    globalExists,
  };
};
