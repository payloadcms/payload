import * as migration_20260120_175309_initial from './20260120_175309_initial'

export const migrations = [
  {
    up: migration_20260120_175309_initial.up,
    down: migration_20260120_175309_initial.down,
    name: '20260120_175309_initial',
  },
]
