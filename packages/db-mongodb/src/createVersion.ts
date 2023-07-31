import { CreateVersion } from 'payload/dist/database/types';
import { PayloadRequest } from 'payload/dist/express/types';
import type { Document } from 'payload/types';
import type { MongooseAdapter } from '.';
import { withSession } from './withSession';

export const createVersion: CreateVersion = async function createVersion(
  this: MongooseAdapter,
  {
    collectionSlug,
    parent,
    versionData,
    autosave,
    createdAt,
    updatedAt,
    req = {} as PayloadRequest,
  },
) {
  const VersionModel = this.versions[collectionSlug];
  const options = withSession(this, req.transactionID);

  const [doc] = await VersionModel.create(
    [
      {
        parent,
        version: versionData,
        autosave,
        createdAt,
        updatedAt,
      },
    ],
    options,
    req,
  );

  const result: Document = JSON.parse(JSON.stringify(doc));
  const verificationToken = doc._verificationToken;

  // custom id type reset
  result.id = result._id;
  if (verificationToken) {
    result._verificationToken = verificationToken;
  }
  return result;
};
