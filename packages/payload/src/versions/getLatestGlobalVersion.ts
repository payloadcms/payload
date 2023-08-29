import { Payload } from '../payload.js';
import { docHasTimestamps, Document, PayloadRequest, Where } from '../types/index.js';
import { SanitizedGlobalConfig } from '../globals/config/types.js';

type Args = {
  payload: Payload
  where: Where
  slug: string
  config: SanitizedGlobalConfig
  locale?: string
  req?: PayloadRequest
}

export const getLatestGlobalVersion = async ({
  payload,
  config,
  slug,
  where,
  locale,
  req,
}: Args): Promise<{ global: Document, globalExists: boolean }> => {
  let latestVersion;

  if (config.versions?.drafts) {
    // eslint-disable-next-line prefer-destructuring
    latestVersion = (await payload.db.findGlobalVersions({
      global: slug,
      limit: 1,
      sort: '-updatedAt',
      locale,
      req,
    })).docs[0];
  }

  const global = await payload.db.findGlobal({
    slug,
    where,
    locale,
    req,
  });
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
