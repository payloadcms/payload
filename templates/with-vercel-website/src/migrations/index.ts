import * as migration_20250516_145223_initial from './20250516_145223_initial'

export const migrations = [
  {
    up: migration_20250516_145223_initial.up,
    down: migration_20250516_145223_initial.down,
    name: '20250516_145223_initial',
  },
]
