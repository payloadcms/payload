import type { MongooseAdapter } from '.';
import type { UpdateVersion } from '../database/types';

export const updateVersion: UpdateVersion = async function updateVersion(this: MongooseAdapter,
  { collectionSlug, where, locale, versionData }) {
  const VersionModel = this.versions[collectionSlug];

  const query = await VersionModel.buildQuery({
    payload: this.payload,
    locale,
    where,
  });


  const doc = await VersionModel.findOneAndUpdate(
    query,
    versionData,
    { new: true, lean: true },
  ).lean();

  const result = JSON.parse(JSON.stringify(doc));

  const verificationToken = doc._verificationToken;

  // custom id type reset
  result.id = result._id;
  if (verificationToken) {
    result._verificationToken = verificationToken;
  }
  return result;
};
