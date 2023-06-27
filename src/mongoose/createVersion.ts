import type { MongooseAdapter } from '.';
import type { CreateVersion } from '../database/types';
import type { Document } from '../types';

export const createVersion: CreateVersion = async function createVersion(this: MongooseAdapter,
  { collectionSlug, parent, versionData, autosave, createdAt, updatedAt }) {
  const VersionModel = this.versions[collectionSlug];


  const doc = await VersionModel.create({
    parent,
    version: versionData,
    autosave,
    createdAt,
    updatedAt,
  });

  let result: Document = doc.toJSON({ virtuals: true });
  const verificationToken = doc._verificationToken;

  // custom id type reset
  result.id = result._id;
  result = JSON.parse(JSON.stringify(result));
  if (verificationToken) {
    result._verificationToken = verificationToken;
  }
  return result;
};
