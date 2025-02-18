import * as migration_20250211_180251_initial from './20250211_180251_initial'

export const migrations = [
  {
    up: migration_20250211_180251_initial.up,
    down: migration_20250211_180251_initial.down,
    name: '20250211_180251_initial',
  },
]
