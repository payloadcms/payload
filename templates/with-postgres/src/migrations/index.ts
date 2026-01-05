import * as migration_20251219_215121_initial from './20251219_215121_initial'

export const migrations = [
  {
    up: migration_20251219_215121_initial.up,
    down: migration_20251219_215121_initial.down,
    name: '20251219_215121_initial',
  },
]
