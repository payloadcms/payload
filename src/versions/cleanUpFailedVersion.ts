import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import { TypeWithVersion } from './types';

type Args = {
  payload: Payload,
  entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig,
  version: TypeWithVersion<any>
}

const cleanUpFailedVersion = (args: Args) => {
  const { payload, entityConfig, version } = args;

  if (version) {
    const VersionModel = payload.versions[entityConfig.slug];
    VersionModel.findOneAndDelete({ _id: version.id });
  }
};

export default cleanUpFailedVersion;
