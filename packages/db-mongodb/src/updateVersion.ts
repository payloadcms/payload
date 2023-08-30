import type { UpdateVersion } from 'payload/database';
import type { PayloadRequest } from 'payload/types';

import type { MongooseAdapter } from './index.js';

import { withSession } from './withSession.js';

export const updateVersion: UpdateVersion = async function updateVersion(
  this: MongooseAdapter,
  { collectionSlug, locale, req = {} as PayloadRequest, versionData, where },
) {
  const VersionModel = this.versions[collectionSlug];
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
    new: true,
  };

  const query = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    where,
  });

  const doc = await VersionModel.findOneAndUpdate(query, versionData, options);

  const result = JSON.parse(JSON.stringify(doc));

  const verificationToken = doc._verificationToken;

  // custom id type reset
  result.id = result._id;
  if (verificationToken) {
    result._verificationToken = verificationToken;
  }
  return result;
};
