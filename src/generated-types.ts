// This is a stub for Payload's generated types.
// It will not be used.
// Instead, configure a path within your `tsconfig.json`'s `compilerOptions.paths` to point to your generated types.

import { TypeWithID } from './collections/config/types';
import { TypeWithID as GlobalTypeWithID } from './globals/config/types';

export type Config = {
  collections: {
    [slug: string | number | symbol]: TypeWithID & Record<string, unknown>
  }
  globals: {
    [slug: string | number | symbol]: GlobalTypeWithID & Record<string, unknown>
  }
}
