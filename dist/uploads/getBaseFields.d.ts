import { Field } from '../fields/config/types';
import { Config } from '../config/types';
import { CollectionConfig } from '../collections/config/types';
type Options = {
    config: Config;
    collection: CollectionConfig;
};
declare const getBaseUploadFields: ({ config, collection }: Options) => Field[];
export default getBaseUploadFields;
