import { TypeWithID } from './collections/config/types';
import { TypeWithID as GlobalTypeWithID } from './globals/config/types';
export type Config = {
    collections: {
        [slug: string | number | symbol]: TypeWithID & Record<string, unknown>;
    };
    globals: {
        [slug: string | number | symbol]: GlobalTypeWithID & Record<string, unknown>;
    };
};
