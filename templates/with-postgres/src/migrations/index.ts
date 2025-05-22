import * as migration_20250516_145237_initial from './20250516_145237_initial'

export const migrations = [
  {
    up: migration_20250516_145237_initial.up,
    down: migration_20250516_145237_initial.down,
    name: '20250516_145237_initial',
  },
]
