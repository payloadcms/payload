import * as migration_20260120_175256_initial from './20260120_175256_initial'

export const migrations = [
  {
    up: migration_20260120_175256_initial.up,
    down: migration_20260120_175256_initial.down,
    name: '20260120_175256_initial',
  },
]
