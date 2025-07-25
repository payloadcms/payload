import * as migration_20250714_175425_initial from './20250714_175425_initial'

export const migrations = [
  {
    up: migration_20250714_175425_initial.up,
    down: migration_20250714_175425_initial.down,
    name: '20250714_175425_initial',
  },
]
