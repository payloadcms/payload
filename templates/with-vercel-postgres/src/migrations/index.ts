import * as migration_20250714_175405_initial from './20250714_175405_initial'

export const migrations = [
  {
    up: migration_20250714_175405_initial.up,
    down: migration_20250714_175405_initial.down,
    name: '20250714_175405_initial',
  },
]
