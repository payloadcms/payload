import * as migration_20241115_213226_initial from './20241115_213226_initial'

export const migrations = [
  {
    up: migration_20241115_213226_initial.up,
    down: migration_20241115_213226_initial.down,
    name: '20241115_213226_initial',
  },
]
