// This is a stub for Payload's generated types.
// It will not be used.
// Instead, configure a path within your `tsconfig.json`'s `compilerOptions.paths` to point to your generated types.

import type { TypeWithID } from './collections/config/types';
import type { TypeWithID as GlobalTypeWithID } from './globals/config/types';

export type Config = {
  collections: {
    [slug: number | string | symbol]: TypeWithID & Record<string, unknown>
  }
  globals: {
    [slug: number | string | symbol]: GlobalTypeWithID & Record<string, unknown>
  }
}
