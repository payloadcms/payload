import * as migration_20241211_181826_initial from './20241211_181826_initial'

export const migrations = [
  {
    up: migration_20241211_181826_initial.up,
    down: migration_20241211_181826_initial.down,
    name: '20241211_181826_initial',
  },
]
