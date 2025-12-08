import * as migration_20251208_015431_initial from './20251208_015431_initial'

export const migrations = [
  {
    up: migration_20251208_015431_initial.up,
    down: migration_20251208_015431_initial.down,
    name: '20251208_015431_initial',
  },
]
