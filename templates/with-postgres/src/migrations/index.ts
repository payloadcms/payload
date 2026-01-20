import * as migration_20260120_175322_initial from './20260120_175322_initial'

export const migrations = [
  {
    up: migration_20260120_175322_initial.up,
    down: migration_20260120_175322_initial.down,
    name: '20260120_175322_initial',
  },
]
