import { Payload } from '..';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import { TypeWithVersion } from './types';
type Args = {
    payload: Payload;
    entityConfig: SanitizedCollectionConfig | SanitizedGlobalConfig;
    version: TypeWithVersion<any>;
};
declare const cleanUpFailedVersion: (args: Args) => void;
export default cleanUpFailedVersion;
