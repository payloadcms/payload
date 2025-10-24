import * as migration_20251024_213226_initial from './20251024_213226_initial'

export const migrations = [
  {
    up: migration_20251024_213226_initial.up,
    down: migration_20251024_213226_initial.down,
    name: '20251024_213226_initial',
  },
]
