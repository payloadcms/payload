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

  const result: Document = JSON.parse(JSON.stringify(doc));
  const verificationToken = doc._verificationToken;

  // custom id type reset
  result.id = result._id;
  if (verificationToken) {
    result._verificationToken = verificationToken;
  }
  return result;
};
