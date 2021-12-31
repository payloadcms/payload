import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { TypeWithVersion } from './types';

type Args = {
  payload: Payload,
  collection: SanitizedCollectionConfig,
  version: TypeWithVersion<any>
}

const cleanUpFailedCollectionVersion = (args: Args) => {
  const { payload, collection, version } = args;

  if (version) {
    const VersionModel = payload.versions[collection.slug];
    VersionModel.findOneAndDelete({ _id: version.id });
  }
};

export default cleanUpFailedCollectionVersion;
