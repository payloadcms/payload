import * as migration_20251208_210515 from './20251208_210515'

export const migrations = [
  {
    up: migration_20251208_210515.up,
    down: migration_20251208_210515.down,
    name: '20251208_210515',
  },
]
