import fs from 'fs'

import type { DrizzleAdapter } from '../types.js'

export async function createSnapshot(
  this: DrizzleAdapter,
  { migrationName }: { migrationName: string },
): Promise<void> {}
