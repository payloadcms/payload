import * as migration_20250110_192009_initial from './20250110_192009_initial'

export const migrations = [
  {
    up: migration_20250110_192009_initial.up,
    down: migration_20250110_192009_initial.down,
    name: '20250110_192009_initial',
  },
]
